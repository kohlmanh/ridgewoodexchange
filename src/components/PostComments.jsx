// PostComments.jsx - FINAL VERSION MATCHING YOUR EXACT TABLE STRUCTURE
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AppStorage } from '../utils/AppStorage';

console.log('✅ POSTCOMMENTS LOADED - WORKING VERSION');

const PostComments = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
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
      
    // Get or create anonymous ID - ONLY FROM LOCAL STORAGE
    const anonId = AppStorage.getAnonymousId();
    setAnonymousId(anonId);
    
    return () => {
      subscription.unsubscribe();
    };
  }, [postId]);
  
  const checkUser = async () => {
    const { data } = await supabase.auth.getUser();
    
    if (data.user) {
      setUser(data.user);
      setIsAuthenticated(true);
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
      // MINIMAL comment data - only the essential fields
      const commentData = {
        post_id: parseInt(postId),
        content: newComment.trim(),
        user_name: isAuthenticated ? (user?.email?.split('@')[0] || 'User') : 'Anonymous'
      };
      
      // Add user identification - only ONE field
      if (isAuthenticated && user?.id) {
        commentData.user_id = user.id;
      } else {
        commentData.anonymous_id = anonymousId;
      }
      
      // Insert the comment
      const { data, error } = await supabase
        .from('Comments')
        .insert(commentData);
        
      if (error) {
        throw error;
      }
      
      // Clear input field
      setNewComment('');
      
      // Refresh comments to show the new one
      await fetchComments();
      
    } catch (err) {
      console.error('Error submitting comment:', err);
      setError(`Failed to submit comment: ${err.message}`);
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
          <div className="text-red-500 text-sm mb-2 bg-red-50 p-2 rounded">
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
        
        <p className="text-sm text-gray-500 mt-2">
          {isAuthenticated ? `Posting as ${user?.email}` : 'Posting anonymously'}
        </p>
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