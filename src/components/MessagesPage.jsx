// MessagesPage.jsx - Unified for both anonymous and authenticated users
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { AppStorage } from '../utils/AppStorage';
import { Send, MessageCircle, User, ArrowLeft } from 'lucide-react';

const MessagesPage = () => {
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [anonymousProfile, setAnonymousProfile] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [relatedPost, setRelatedPost] = useState(null);
  
  const messagesEndRef = useRef(null);
  
  // Load initial conversation ID from URL if available
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId) {
      loadConversationById(conversationId);
    }
    initializeUser();
    fetchConversations();
  }, [searchParams]);
  
  // Scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Subscribe to messages when conversation changes
  useEffect(() => {
    let subscription;
    
    if (currentConversation) {
      fetchMessages();
      markMessagesAsRead();
      
      // Set up real-time subscription
      subscription = supabase
        .channel(`conversation-${currentConversation.id}`)
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'Messages',
            filter: `conversation_id=eq.${currentConversation.id}`
          }, 
          (payload) => {
            setMessages(current => [...current, payload.new]);
            markNewMessageAsRead(payload.new);
          }
        )
        .subscribe();
    }
    
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [currentConversation, currentUser, anonymousProfile]);
  
  const initializeUser = async () => {
    const { data } = await supabase.auth.getUser();
    setCurrentUser(data.user);
    
    if (!data.user) {
      // Set up anonymous profile
      const profile = AppStorage.getAnonymousProfile();
      setAnonymousProfile(profile);
      
      // Ensure anonymous user exists in database
      try {
        await supabase.rpc('upsert_anonymous_user', {
          anon_id: profile.anonymousId,
          display_name: profile.displayName
        });
      } catch (err) {
        console.log('Could not upsert anonymous user:', err);
      }
    }
  };
  
  const loadConversationById = async (conversationId) => {
    try {
      const { data, error } = await supabase
        .from('Conversations')
        .select('*')
        .eq('id', conversationId)
        .single();
        
      if (error) {
        console.log('Conversation not found:', error);
        return;
      }
      
      setCurrentConversation(data);
    } catch (err) {
      console.error('Error loading conversation:', err);
    }
  };
  
  const fetchConversations = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      const anonymousId = AppStorage.getAnonymousId();
      
      let query = supabase
        .from('Conversations')
        .select('*')
        .order('last_message_at', { ascending: false });
      
      // Filter conversations for current user (anonymous or authenticated)
      if (user?.id) {
        // Try both old and new schema
        query = query.or(`user1_id.eq.${user.id},user2_id.eq.${user.id},user1_auth_id.eq.${user.id},user2_auth_id.eq.${user.id}`);
      } else {
        query = query.or(`user1_anonymous_id.eq.${anonymousId},user2_anonymous_id.eq.${anonymousId}`);
      }
      
      const { data: conversationsData, error } = await query;
      
      if (error) throw error;
      
      // Get unread message counts for each conversation
      if (conversationsData && conversationsData.length > 0) {
        const unreadPromises = conversationsData.map(async (conversation) => {
          let countQuery = supabase
            .from('Messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conversation.id);
            
          // Handle both old and new schema for read status
          if ('read_by_recipient' in conversation) {
            countQuery = countQuery.eq('read_by_recipient', false);
          } else {
            countQuery = countQuery.eq('read', false);
          }
          
          // Don't count own messages
          if (user?.id) {
            countQuery = countQuery.not('sender_id', 'eq', user.id).not('sender_auth_id', 'eq', user.id);
          } else {
            countQuery = countQuery.not('sender_anonymous_id', 'eq', anonymousId);
          }
          
          const { count, error: countError } = await countQuery;
          return countError ? 0 : count;
        });
        
        const unreadCounts = await Promise.all(unreadPromises);
        
        conversationsData.forEach((conversation, index) => {
          conversation.unreadCount = unreadCounts[index] || 0;
        });
      }
      
      setConversations(conversationsData || []);
      
      // Auto-select first conversation if none selected
      if (!currentConversation && conversationsData && conversationsData.length > 0) {
        setCurrentConversation(conversationsData[0]);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setLoading(false);
    }
  };
  
  const fetchMessages = async () => {
    if (!currentConversation) return;
    
    try {
      const { data, error } = await supabase
        .from('Messages')
        .select('*')
        .eq('conversation_id', currentConversation.id)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      setMessages(data || []);
      
      // Load other user & post details
      loadOtherUserAndPost();
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };
  
  const loadOtherUserAndPost = async () => {
    if (!currentConversation) return;
    
    // Determine other user based on schema
    let otherUserId = null;
    let otherUserName = 'User';
    
    if (currentUser?.id) {
      // Authenticated user - check both old and new schema
      if (currentConversation.user1_id === currentUser.id) {
        otherUserId = currentConversation.user2_id;
      } else if (currentConversation.user2_id === currentUser.id) {
        otherUserId = currentConversation.user1_id;
      } else if (currentConversation.user1_auth_id === currentUser.id) {
        otherUserName = currentConversation.user2_display_name || 'User';
      } else if (currentConversation.user2_auth_id === currentUser.id) {
        otherUserName = currentConversation.user1_display_name || 'User';
      }
    } else {
      // Anonymous user - use display names from new schema
      const anonymousId = AppStorage.getAnonymousId();
      if (currentConversation.user1_anonymous_id === anonymousId) {
        otherUserName = currentConversation.user2_display_name || 'User';
      } else if (currentConversation.user2_anonymous_id === anonymousId) {
        otherUserName = currentConversation.user1_display_name || 'User';
      }
    }
    
    // Try to get other user details from profiles if we have a user ID
    if (otherUserId) {
      try {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('username, full_name, avatar_url')
          .eq('id', otherUserId)
          .maybeSingle();
          
        if (userData && !userError) {
          setOtherUser({
            ...userData,
            displayName: userData.username || userData.full_name || userData.email || 'User'
          });
        } else {
          setOtherUser({ displayName: otherUserName });
        }
      } catch (err) {
        setOtherUser({ displayName: otherUserName });
      }
    } else {
      setOtherUser({ displayName: otherUserName });
    }
    
    // Get post details if available
    if (currentConversation.post_id) {
      try {
        const { data: postData, error: postError } = await supabase
          .from('Posts')
          .select('*')
          .eq('id', currentConversation.post_id)
          .maybeSingle();
          
        if (postData && !postError) {
          setRelatedPost(postData);
        }
      } catch (err) {
        console.log('Could not load related post:', err);
      }
    }
  };
  
  const markMessagesAsRead = async () => {
    if (!currentConversation) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const anonymousId = AppStorage.getAnonymousId();
      
      let query = supabase
        .from('Messages')
        .eq('conversation_id', currentConversation.id);
        
      // Handle both old and new schema
      const sampleMessage = messages[0];
      if (sampleMessage && 'read_by_recipient' in sampleMessage) {
        query = query.update({ read_by_recipient: true }).eq('read_by_recipient', false);
      } else {
        query = query.update({ read: true }).eq('read', false);
      }
      
      // Don't mark own messages as read
      if (user?.id) {
        if (sampleMessage && 'sender_auth_id' in sampleMessage) {
          query = query.not('sender_auth_id', 'eq', user.id);
        } else {
          query = query.not('sender_id', 'eq', user.id);
        }
      } else {
        query = query.not('sender_anonymous_id', 'eq', anonymousId);
      }
      
      const { error } = await query;
      
      if (error) throw error;
      
      // Update conversations list
      setConversations(current => 
        current.map(conv => 
          conv.id === currentConversation.id
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };
  
  const markNewMessageAsRead = async (message) => {
    const { data: { user } } = await supabase.auth.getUser();
    const anonymousId = AppStorage.getAnonymousId();
    
    // Check if this message is from someone else
    let isFromCurrentUser = false;
    
    if (user?.id) {
      isFromCurrentUser = message.sender_id === user.id || message.sender_auth_id === user.id;
    } else {
      isFromCurrentUser = message.sender_anonymous_id === anonymousId;
    }
      
    if (!isFromCurrentUser) {
      try {
        let updateData = {};
        if ('read_by_recipient' in message) {
          updateData.read_by_recipient = true;
        } else {
          updateData.read = true;
        }
        
        await supabase
          .from('Messages')
          .update(updateData)
          .eq('id', message.id);
      } catch (err) {
        console.error('Error marking message as read:', err);
      }
    }
  };
  
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !currentConversation) return;
    
    setSendingMessage(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const anonymousId = AppStorage.getAnonymousId();
      const profile = AppStorage.getAnonymousProfile();
      
      let displayName = 'Anonymous';
      if (user?.id) {
        displayName = user.email?.split('@')[0] || 'User';
      } else if (profile?.displayName) {
        displayName = profile.displayName;
      }
      
      const messageData = {
        conversation_id: currentConversation.id,
        content: newMessage.trim(),
        created_at: new Date().toISOString()
      };
      
      // Handle both old and new schema
      if ('sender_display_name' in currentConversation || messages.some(m => 'sender_display_name' in m)) {
        // New schema
        messageData.sender_display_name = displayName;
        messageData.read_by_recipient = false;
        
        if (user?.id) {
          messageData.sender_auth_id = user.id;
        } else {
          messageData.sender_anonymous_id = anonymousId;
        }
      } else {
        // Old schema fallback
        messageData.read = false;
        if (user?.id) {
          messageData.sender_id = user.id;
        }
      }
      
      const { error: messageError } = await supabase
        .from('Messages')
        .insert([messageData]);
        
      if (messageError) throw messageError;
      
      // Update conversation timestamp
      const { error: conversationError } = await supabase
        .from('Conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', currentConversation.id);
        
      if (conversationError) throw conversationError;
      
      // Create notification for authenticated users
      if (user?.id && (currentConversation.user1_id || currentConversation.user2_id)) {
        try {
          const recipientId = currentConversation.user1_id === user.id
            ? currentConversation.user2_id
            : currentConversation.user1_id;
            
          if (recipientId) {
            await supabase
              .from('UserNotifications')
              .insert({
                recipient_id: recipientId,
                sender_id: user.id,
                type: 'message',
                content: `New message: "${newMessage.substring(0, 50)}${newMessage.length > 50 ? '...' : ''}"`,
                post_id: currentConversation.post_id,
                read: false
              });
          }
        } catch (notificationError) {
          console.log('Could not create notification:', notificationError);
        }
      }
      
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSendingMessage(false);
    }
  };
  
  const selectConversation = (conversation) => {
    setCurrentConversation(conversation);
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const getOtherUserName = (conversation) => {
    if (!conversation) return 'User';
    
    if (currentUser?.id) {
      // Authenticated user
      if (conversation.user1_id === currentUser.id) {
        return conversation.user2?.username || conversation.user2?.email || conversation.user2_display_name || 'User';
      } else if (conversation.user2_id === currentUser.id) {
        return conversation.user1?.username || conversation.user1?.email || conversation.user1_display_name || 'User';
      } else if (conversation.user1_auth_id === currentUser.id) {
        return conversation.user2_display_name || 'User';
      } else if (conversation.user2_auth_id === currentUser.id) {
        return conversation.user1_display_name || 'User';
      }
    } else {
      // Anonymous user
      const anonymousId = AppStorage.getAnonymousId();
      if (conversation.user1_anonymous_id === anonymousId) {
        return conversation.user2_display_name || 'User';
      } else if (conversation.user2_anonymous_id === anonymousId) {
        return conversation.user1_display_name || 'User';
      }
    }
    
    return 'User';
  };
  
  const isOwnMessage = (message) => {
    if (currentUser?.id) {
      return message.sender_id === currentUser.id || message.sender_auth_id === currentUser.id;
    } else {
      const anonymousId = AppStorage.getAnonymousId();
      return message.sender_anonymous_id === anonymousId;
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <Link to="/communityfeed" className="flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-4">
          <ArrowLeft size={16} className="mr-2" />
          Back to Listings
        </Link>
        <div className="flex items-center gap-3">
          <MessageCircle className="text-blue-600" size={24} />
          <h1 className="text-2xl font-bold text-blue-700">Messages</h1>
        </div>
        <p className="text-gray-600 mt-1">
          {currentUser ? 'Authenticated' : 'Anonymous'} messaging • {!currentUser && 'No account required'}
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 h-[70vh]">
        {/* Conversations List */}
        <div className="w-full md:w-1/3 border rounded-lg overflow-hidden flex flex-col">
          <div className="bg-gray-50 p-3 border-b">
            <h2 className="font-medium">Conversations</h2>
          </div>
          
          <div className="overflow-y-auto flex-grow">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <MessageCircle size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="font-medium">No conversations yet</p>
                <p className="text-sm mt-2">
                  {currentUser 
                    ? "When someone expresses interest in your listings, or you express interest in others' listings, conversations will appear here."
                    : "Express interest in listings to start anonymous conversations"
                  }
                </p>
              </div>
            ) : (
              conversations.map((conversation) => {
                const otherUserName = getOtherUserName(conversation);
                
                return (
                  <button
                    key={conversation.id}
                    className={`w-full text-left p-3 border-b hover:bg-gray-50 transition-colors
                      ${currentConversation?.id === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}
                      ${conversation.unreadCount > 0 ? 'font-semibold' : ''}`}
                    onClick={() => selectConversation(conversation)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-gray-400" />
                          <p className="font-medium truncate">{otherUserName}</p>
                        </div>
                        {(conversation.post?.title || conversation.post_title) && (
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            Re: {conversation.post?.title || conversation.post_title}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(conversation.last_message_at).toLocaleDateString()}
                        </p>
                      </div>
                      
                      {conversation.unreadCount > 0 && (
                        <span className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ml-2">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
        
        {/* Messages */}
        <div className="w-full md:w-2/3 border rounded-lg overflow-hidden flex flex-col">
          {currentConversation ? (
            <>
              {/* Conversation Header */}
              <div className="bg-gray-50 p-3 border-b flex items-center justify-between">
                <div>
                  <h2 className="font-medium">
                    {otherUser?.displayName || getOtherUserName(currentConversation)}
                  </h2>
                  {(relatedPost?.title || currentConversation.post_title) && (
                    <p className="text-xs text-gray-500">
                      Re: {relatedPost?.title || currentConversation.post_title}
                    </p>
                  )}
                </div>
                
                {(relatedPost?.id || currentConversation.post_id) && (
                  <Link 
                    to={`/post/${relatedPost?.id || currentConversation.post_id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View Listing
                  </Link>
                )}
              </div>
              
              {/* Messages List */}
              <div className="flex-grow overflow-y-auto p-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((message) => {
                    const isCurrentUserMessage = isOwnMessage(message);
                    
                    return (
                      <div 
                        key={message.id} 
                        className={`mb-4 flex ${isCurrentUserMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[80%] rounded-lg p-3 
                            ${isCurrentUserMessage 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-white border border-gray-300'
                            }`}
                        >
                          {!isCurrentUserMessage && message.sender_display_name && (
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-gray-600">
                                {message.sender_display_name}
                              </span>
                            </div>
                          )}
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          <p 
                            className={`text-xs mt-2 
                              ${isCurrentUserMessage ? 'text-blue-100' : 'text-gray-500'}`}
                          >
                            {new Date(message.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Message Input */}
              <div className="p-3 border-t bg-white">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-grow border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={sendingMessage}
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-md flex items-center justify-center disabled:opacity-50"
                    disabled={!newMessage.trim() || sendingMessage}
                  >
                    {sendingMessage ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </form>
                <p className="text-xs text-gray-500 mt-1">
                  {currentUser ? 'Authenticated messaging' : 'Anonymous messaging'} • Messages are private
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500 text-center p-8">
                <MessageCircle size={64} className="mx-auto text-gray-300 mb-4" />
                <p className="text-lg font-medium mb-2">Select a conversation</p>
                {conversations.length === 0 ? (
                  <div>
                    <p className="text-sm mb-4">
                      Express interest in listings to start conversations
                    </p>
                    <Link 
                      to="/communityfeed"
                      className="text-blue-600 hover:underline"
                    >
                      Browse Listings
                    </Link>
                  </div>
                ) : (
                  <p className="text-sm">
                    Choose a conversation from the left to view messages
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;