import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const Comments = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchComments();
    
    // Set up real-time subscription for new comments
    const channel = supabase.channel('comments-channel');
    
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Comments',
          filter: `post_id=eq.${postId}`
        },
        (payload) => {
          console.log('New comment received:', payload);
          setComments(currentComments => [payload.new, ...currentComments]);
        }
      )
      .subscribe();
    
    return () => {
      channel.unsubscribe();
    };
  }, [postId]);

  const fetchComments = async () => {
    setLoading(true);
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
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    setSubmitting(true);
    try {
      // Insert new comment
      const { data, error } = await supabase
        .from('Comments')
        .insert([
          { 
            post_id: postId,
            content: newComment,
            created_at: new Date().toISOString(),
            user_name: 'Anonymous User' // Replace with actual user name when auth is implemented
          }
        ])
        .select();
        
      if (error) throw error;
      
      // Update comment count in Posts table
      await supabase.rpc('increment_comment_count', { post_id: postId });
      
      // Reset form
      setNewComment('');
    } catch (err) {
      console.error('Error submitting comment:', err);
      setError('Failed to submit comment');
    } finally {
      setSubmitting(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    }
  };

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-3" style={{ color: '#0052cc' }}>
        Comments
      </h2>
      
      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Leave a comment..."
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            rows={3}
          ></textarea>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="px-6 py-2 rounded-lg font-medium bg-blue-500 text-white disabled:opacity-50"
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </form>
      
      {/* Comments List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="flex justify-center items-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">{error}</div>
        ) : comments.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No comments yet. Be the first to comment!</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {comments.map((comment) => (
              <div key={comment.id} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium">{comment.user_name}</div>
                  <div className="text-xs text-gray-500">{formatDate(comment.created_at)}</div>
                </div>
                <p className="text-gray-700">{comment.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Comments;