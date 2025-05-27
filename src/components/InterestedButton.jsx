// InterestedButton.jsx - Simplified version that avoids RPC calls
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { AppStorage } from '../utils/AppStorage';

const InterestedButton = ({ postId, postTitle, postOwnerId, postOwnerAnonymousId }) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [showNameInput, setShowNameInput] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [user, setUser] = useState(null);
  const [anonymousProfile, setAnonymousProfile] = useState(null);
  const [hasExpressedInterest, setHasExpressedInterest] = useState(false);

  useEffect(() => {
    initializeUser();
    checkExistingInterest();
  }, [postId]);

  const initializeUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
    
    if (!data.user) {
      // Set up anonymous profile
      const profile = AppStorage.getAnonymousProfile();
      setAnonymousProfile(profile);
    }
  };

  const checkExistingInterest = () => {
    // Check if user has already expressed interest (for anonymous users)
    if (!user) {
      const hasInterest = AppStorage.hasExpressedInterest(postId);
      setHasExpressedInterest(hasInterest);
    }
  };

  const handleInterestedClick = async () => {
    // For anonymous users: check if they want to provide a name
    if (!user) {
      const profile = AppStorage.getAnonymousProfile();
      if (!profile.displayName && !displayName) {
        setShowNameInput(true);
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      const anonymousId = user ? null : AppStorage.getAnonymousId();
      let finalDisplayName = 'Anonymous User';
      
      if (user) {
        // Authenticated user
        finalDisplayName = user.email?.split('@')[0] || 'User';
        
        // Try to get better name from profiles
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, full_name')
            .eq('id', user.id)
            .maybeSingle();
            
          if (profileData) {
            finalDisplayName = profileData.username || profileData.full_name || finalDisplayName;
          }
        } catch (err) {
          console.log('Could not fetch user profile');
        }
      } else {
        // Anonymous user
        const profile = AppStorage.getAnonymousProfile();
        finalDisplayName = displayName || profile.displayName || 'Anonymous User';
        
        // Save display name if provided
        if (displayName && !profile.displayName) {
          AppStorage.setAnonymousProfile({ displayName: displayName });
        }
      }

      // Step 1: Express interest in PostInterests table
      const interestData = {
        post_id: postId,
        interested_display_name: finalDisplayName,
        message: `Hi! I'm interested in your listing "${postTitle}".`,
        created_at: new Date().toISOString()
      };

      if (user?.id) {
        interestData.interested_auth_id = user.id;
      } else {
        interestData.interested_anonymous_id = anonymousId;
      }

      const { error: interestError } = await supabase
        .from('PostInterests')
        .insert([interestData]);
        
      if (interestError) throw interestError;

      // Step 2: Create conversation directly (no RPC call)
      const conversationData = {
        user1_display_name: finalDisplayName,
        user2_display_name: 'Post Owner',
        post_id: postId,
        post_title: postTitle,
        last_message_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      if (user?.id) {
        conversationData.user1_auth_id = user.id;
      } else {
        conversationData.user1_anonymous_id = anonymousId;
      }

      if (postOwnerId) {
        conversationData.user2_auth_id = postOwnerId;
      } else if (postOwnerAnonymousId) {
        conversationData.user2_anonymous_id = postOwnerAnonymousId;
      }

      console.log('Conversation data to insert:', conversationData);

      const { data: newConv, error: convError } = await supabase
        .from('Conversations')
        .insert([conversationData])
        .select('id')
        .single();

      if (convError) throw convError;
      
      const conversationId = newConv.id;

      // Step 3: Add initial message
      const messageData = {
        conversation_id: conversationId,
        sender_display_name: finalDisplayName,
        content: `Hi! I'm interested in your listing "${postTitle}".`,
        read_by_recipient: false,
        created_at: new Date().toISOString()
      };

      if (user?.id) {
        messageData.sender_auth_id = user.id;
      } else {
        messageData.sender_anonymous_id = anonymousId;
      }

      const { error: messageError } = await supabase
        .from('Messages')
        .insert([messageData]);
        
      if (messageError) throw messageError;

      // Store conversation locally for anonymous users
      if (!user) {
        AppStorage.addAnonymousConversation({
          id: conversationId,
          postId,
          postTitle,
          otherUserName: 'Post Owner',
          lastMessage: messageData.content,
          lastMessageAt: messageData.created_at
        });

        // Track interest locally
        AppStorage.addAnonymousInterest({
          postId,
          postTitle,
          conversationId,
          timestamp: new Date().toISOString()
        });

        setHasExpressedInterest(true);
      }
      
      setSubmitted(true);
      
      // Navigate to messages after a short delay
      setTimeout(() => {
        navigate(`/messages?conversation=${conversationId}`);
      }, 1500);
      
    } catch (err) {
      console.error('Error expressing interest:', err);
      setError(`Error: ${err.message || 'Something went wrong. Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (displayName.trim()) {
      setShowNameInput(false);
      handleInterestedClick();
    }
  };

  // Don't show button if this is the user's own post
  if ((user && user.id === postOwnerId) || 
      (!user && anonymousProfile && anonymousProfile.anonymousId === postOwnerAnonymousId)) {
    return (
      <div className="mt-4 bg-gray-100 text-gray-600 p-3 rounded-md text-center">
        This is your post
      </div>
    );
  }

  // Show if already expressed interest (for anonymous users)
  if (hasExpressedInterest && !user) {
    return (
      <div className="mt-4">
        <div className="bg-green-100 text-green-800 p-3 rounded-md text-center">
          <p className="font-medium">Interest already sent</p>
          <button
            onClick={() => navigate('/messages')}
            className="mt-2 text-sm text-green-700 hover:underline"
          >
            View your messages
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mt-4">
        <div className="bg-green-100 text-green-800 p-3 rounded-md">
          <p className="font-medium">Interest sent!</p>
          <p className="text-sm">Redirecting to your conversation...</p>
        </div>
      </div>
    );
  }

  if (showNameInput) {
    return (
      <div className="mt-4">
        <div className="bg-blue-50 p-4 rounded-md">
          <p className="text-sm text-blue-800 mb-3">
            What name would you like to use for messaging? (Optional - you can stay anonymous)
          </p>
          <form onSubmit={handleNameSubmit} className="space-y-3">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter a name or leave blank to stay anonymous"
              className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={50}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition"
              >
                Continue
              </button>
              <button
                type="button"
                onClick={() => {
                  setDisplayName('');
                  setShowNameInput(false);
                  handleInterestedClick();
                }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition"
              >
                Stay Anonymous
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <button
        onClick={handleInterestedClick}
        disabled={isSubmitting}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md 
                  flex items-center justify-center w-full transition duration-150 disabled:opacity-50"
      >
        {isSubmitting ? 'Sending...' : "I'm Interested"}
      </button>
      
      {error && (
        <div className="text-red-600 mt-2 text-sm">
          {error}
        </div>
      )}
      
      <p className="text-xs text-gray-500 mt-2 text-center">
        {user ? 'Authenticated messaging' : 'No account required • Anonymous messaging available'}
      </p>
    </div>
  );
};

export default InterestedButton;