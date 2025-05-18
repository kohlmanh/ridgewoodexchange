// InterestedButton.jsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient'; // Update path as needed

const InterestedButton = ({ postId, postTitle, postOwnerId }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleInterestedClick = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Get current user info
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("Please sign in to express interest in this item");
        setIsSubmitting(false);
        return;
      }
      
      // Create a notification for the post owner
      const { error: notificationError } = await supabase
        .from('UserNotifications')
        .insert({
          recipient_id: postOwnerId,
          type: 'interest',
          content: `Someone is interested in your listing: "${postTitle}"`,
          post_id: postId,
          sender_id: user.id,
          read: false
        });
        
      if (notificationError) throw notificationError;
      
      // Create a conversation record or update existing one
      const { data: existingConversation, error: convCheckError } = await supabase
        .from('Conversations')
        .select('id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .or(`user1_id.eq.${postOwnerId},user2_id.eq.${postOwnerId}`)
        .maybeSingle();
      
      if (convCheckError) throw convCheckError;
      
      let conversationId;
      
      if (existingConversation) {
        conversationId = existingConversation.id;
      } else {
        // Create new conversation
        const { data: newConversation, error: createConvError } = await supabase
          .from('Conversations')
          .insert({
            user1_id: user.id,
            user2_id: postOwnerId,
            last_message_at: new Date().toISOString(),
            post_id: postId
          })
          .select('id')
          .single();
          
        if (createConvError) throw createConvError;
        conversationId = newConversation.id;
      }
      
      // Add an initial message
      const { error: messageError } = await supabase
        .from('Messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: `Hi! I'm interested in your listing "${postTitle}".`,
          read: false
        });
        
      if (messageError) throw messageError;
      
      setSubmitted(true);
    } catch (err) {
      console.error('Error expressing interest:', err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4">
      {submitted ? (
        <div className="bg-green-100 text-green-800 p-3 rounded-md">
          Interest sent! Check your messages to continue the conversation.
        </div>
      ) : (
        <button
          onClick={handleInterestedClick}
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md 
                    flex items-center justify-center w-full transition duration-150"
        >
          {isSubmitting ? 'Sending...' : "I'm Interested"}
        </button>
      )}
      
      {error && (
        <div className="text-red-600 mt-2 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default InterestedButton;