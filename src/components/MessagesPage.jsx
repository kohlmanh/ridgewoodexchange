// MessagesPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Send } from 'lucide-react';

const MessagesPage = () => {
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [relatedPost, setRelatedPost] = useState(null);
  
  const messagesEndRef = useRef(null);
  
  // Load initial conversation ID from URL if available
  useEffect(() => {
    const postId = searchParams.get('conversation');
    if (postId) {
      loadConversationByPostId(postId);
    }
    loadCurrentUser();
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
            if (payload.new.sender_id !== currentUser?.id) {
              markMessageAsRead(payload.new.id);
            }
          }
        )
        .subscribe();
    }
    
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [currentConversation, currentUser]);
  
  const loadCurrentUser = async () => {
    const { data } = await supabase.auth.getUser();
    setCurrentUser(data.user);
  };
  
  const loadConversationByPostId = async (postId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;
      
      const { data, error } = await supabase
        .from('Conversations')
        .select('*')
        .eq('post_id', postId)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .single();
        
      if (error) {
        // If no conversation exists yet, we might be coming from a notification
        // In this case, just load the regular conversation list
        console.log('No existing conversation found for this post');
        return;
      }
      
      setCurrentConversation(data);
    } catch (err) {
      console.error('Error loading conversation by post ID:', err);
    }
  };
  
  const fetchConversations = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }
      
      // Get all conversations this user is part of
      const { data: conversationsData, error } = await supabase
        .from('Conversations')
        .select(`
          *,
          user1:user1_id(id, email, username),
          user2:user2_id(id, email, username),
          post:post_id(id, title, image_url)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });
        
      if (error) throw error;
      
      // Get unread message counts for each conversation
      if (conversationsData.length > 0) {
        const unreadPromises = conversationsData.map(async (conversation) => {
          const { count, error: countError } = await supabase
            .from('Messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conversation.id)
            .eq('read', false)
            .neq('sender_id', user.id);
            
          return countError ? 0 : count;
        });
        
        const unreadCounts = await Promise.all(unreadPromises);
        
        // Add unread count to each conversation
        conversationsData.forEach((conversation, index) => {
          conversation.unreadCount = unreadCounts[index] || 0;
        });
      }
      
      setConversations(conversationsData || []);
      
      // If we don't have a selected conversation yet and there are conversations available,
      // select the first one
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
    if (!currentConversation || !currentUser) return;
    
    // Determine who the other user is
    const otherUserId = currentConversation.user1_id === currentUser.id
      ? currentConversation.user2_id
      : currentConversation.user1_id;
      
    // Get other user details
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('username, full_name, avatar_url')
      .eq('id', otherUserId)
      .single();
      
    if (!userError) {
      setOtherUser(userData);
    }
    
    // Get post details if available
    if (currentConversation.post_id) {
      const { data: postData, error: postError } = await supabase
        .from('Posts')
        .select('*')
        .eq('id', currentConversation.post_id)
        .single();
        
      if (!postError) {
        setRelatedPost(postData);
      }
    }
  };
  
  const markMessagesAsRead = async () => {
    if (!currentConversation || !currentUser) return;
    
    try {
      const { error } = await supabase
        .from('Messages')
        .update({ read: true })
        .eq('conversation_id', currentConversation.id)
        .neq('sender_id', currentUser.id)
        .eq('read', false);
        
      if (error) throw error;
      
      // Update conversations list to reflect read status
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
  
  const markMessageAsRead = async (messageId) => {
    try {
      await supabase
        .from('Messages')
        .update({ read: true })
        .eq('id', messageId);
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };
  
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !currentConversation || !currentUser) return;
    
    setSendingMessage(true);
    
    try {
      // Insert the new message
      const { error: messageError } = await supabase
        .from('Messages')
        .insert({
          conversation_id: currentConversation.id,
          sender_id: currentUser.id,
          content: newMessage.trim(),
          read: false
        });
        
      if (messageError) throw messageError;
      
      // Update last_message_at in the conversation
      const { error: conversationError } = await supabase
        .from('Conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', currentConversation.id);
        
      if (conversationError) throw conversationError;
      
      // Create a notification for the other user
      const recipientId = currentConversation.user1_id === currentUser.id
        ? currentConversation.user2_id
        : currentConversation.user1_id;
        
      const { error: notificationError } = await supabase
        .from('UserNotifications')
        .insert({
          recipient_id: recipientId,
          sender_id: currentUser.id,
          type: 'message',
          content: `New message: "${newMessage.substring(0, 50)}${newMessage.length > 50 ? '...' : ''}"`,
          post_id: currentConversation.post_id,
          read: false
        });
        
      if (notificationError) console.error('Error creating notification:', notificationError);
      
      // Clear input field
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
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-blue-700 mb-6">Messages</h1>
      
      <div className="flex flex-col md:flex-row gap-4 h-[70vh]">
        {/* Conversations List */}
        <div className="w-full md:w-1/3 border rounded-lg overflow-hidden flex flex-col">
          <div className="bg-gray-50 p-3 border-b">
            <h2 className="font-medium">Conversations</h2>
          </div>
          
          <div className="overflow-y-auto flex-grow">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No conversations yet
              </div>
            ) : (
              conversations.map((conversation) => {
                const otherUserData = conversation.user1_id === currentUser?.id
                  ? conversation.user2
                  : conversation.user1;
                  
                return (
                  <button
                    key={conversation.id}
                    className={`w-full text-left p-3 border-b hover:bg-gray-50 
                      ${currentConversation?.id === conversation.id ? 'bg-blue-50' : ''}
                      ${conversation.unreadCount > 0 ? 'font-semibold' : ''}`}
                    onClick={() => selectConversation(conversation)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p>{otherUserData?.username || otherUserData?.email || 'User'}</p>
                        {conversation.post && (
                          <p className="text-xs text-gray-500">
                            About: {conversation.post.title}
                          </p>
                        )}
                      </div>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
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
                    {otherUser?.username || 'User'}
                  </h2>
                  {relatedPost && (
                    <p className="text-xs text-gray-500">
                      Re: {relatedPost.title}
                    </p>
                  )}
                </div>
                
                {relatedPost && (
                  <a 
                    href={`/post/${relatedPost.id}`}
                    className="text-sm text-blue-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Listing
                  </a>
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
                    const isCurrentUserMessage = message.sender_id === currentUser?.id;
                    
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
                          <p>{message.content}</p>
                          <p 
                            className={`text-xs mt-1 
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
                <form onSubmit={sendMessage} className="flex">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-grow border rounded-l-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={sendingMessage}
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-r-md flex items-center justify-center"
                    disabled={!newMessage.trim() || sendingMessage}
                  >
                    {sendingMessage ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500 text-center p-4">
                <p>Select a conversation to view messages</p>
                {conversations.length === 0 && (
                  <p className="mt-2 text-sm">
                    When someone expresses interest in one of your listings, 
                    or you express interest in someone else's listing, 
                    your conversations will appear here.
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