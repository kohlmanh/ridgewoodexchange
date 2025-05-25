// PostComments.jsx - Integrated version
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AppStorage } from '../utils/storage';

const PostComments = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [anonymousId, setAnonymousId] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    fetchComments();
    checkUser();
    
    // Set up real-time subscription for new comments
    const subscription = supabase
      .channel(`post-${postId}-comments`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'Comments',
          filter: `post_id=eq.${postId}`
        }, 
        (payload) => {
          setComments(current => [payload.new, ...current]);
        }
      )
      .subscribe();
      
   // Get or create anonymous ID
const anonymousId = AppStorage.getAnonymousId();
setAnonymousId(anonymousId);
    
    return () => {
      subscription.unsubscribe();
    };
  }, [postId]);
  
  const checkUser = async () => {
    const { data } = await supabase.auth.getUser();
    
    if (data.user) {
      setUser(data.user);
      setIsAuthenticated(true);
      
      // Fetch username if available
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, full_name')
        .eq('id', data.user.id)
        .single();
        
      if (profileData) {
        setUsername(profileData.username || profileData.full_name || data.user.email);
      }
    } else {
      setIsAuthenticated(false);
    }
  };
  
  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('Comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setComments(data || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Failed to load comments. Please refresh the page.');
    }
  };
  
  const submitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const commentData = {
        post_id: postId,
        content: newComment.trim(),
      };
      
      // Set user data based on authentication status
      if (isAuthenticated) {
        commentData.user_id = user.id;
        commentData.user_name = username;
      } else {
        commentData.user_name = 'Anonymous';
        commentData.anonymous_id = anonymousId;
      }
      
      const { error } = await supabase
        .from('Comments')
        .insert(commentData);
        
      if (error) throw error;
      
      // Clear input field
      setNewComment('');
      
      // Notify post owner (optional)
      const { data: postData } = await supabase
        .from('Posts')
        .select('user_id, title')
        .eq('id', postId)
        .single();
        
      if (postData && postData.user_id && postData.user_id !== user?.id) {
        await supabase
          .from('UserNotifications')
          .insert({
            recipient_id: postData.user_id,
            sender_id: user?.id || null,
            type: 'comment',
            content: `New comment on your post "${postData.title}"`,
            post_id: postId,
            read: false
          });
      }
    } catch (err) {
      console.error('Error submitting comment:', err);
      setError('Failed to submit comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Format date to a readable string
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="mt-6">
      <h3 className="text-xl font-semibold mb-4">Comments</h3>
      
      {/* Comment Form */}
      <form onSubmit={submitComment} className="mb-6">
        <div className="mb-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
            required
          />
        </div>
        
        {error && (
          <div className="text-red-500 text-sm mb-2">
            {error}
          </div>
        )}
        
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition"
          disabled={!newComment.trim() || isSubmitting}
        >
          {isSubmitting ? 'Posting...' : 'Post Comment'}
        </button>
        
        {!isAuthenticated && (
          <p className="text-sm text-gray-500 mt-2">
            You are commenting as Anonymous. 
            <a href="/login" className="text-blue-600 hover:underline ml-1">
              Sign in
            </a> to use your name.
          </p>
        )}
      </form>
      
      {/* Comments List */}
      <div className="space-y-4">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="border rounded-md p-4 bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">
                    {comment.user_name || 'Anonymous'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(comment.created_at)}
                  </p>
                </div>
              </div>
              <p className="mt-2">{comment.content}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-gray-500">
            No comments yet. Be the first to comment!
          </div>
        )}
      </div>
    </div>
  );
};

export default PostComments;