import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Clock, Edit, Trash, ArrowLeft } from 'lucide-react';
import { AppStorage, useUserPosts } from '../utils/AppStorage';

const MyPostsPage = () => {
  const navigate = useNavigate();
  const { posts: userPosts, removePost } = useUserPosts();
  const [postDetails, setPostDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        
        if (userPosts.length === 0) {
          setLoading(false);
          return;
        }
        
        // Get post IDs
        const postIds = userPosts.map(post => post.id);
        
        // Fetch full post details from Supabase
        const { data, error } = await supabase
          .from('Posts')
          .select('*')
          .in('id', postIds);
        
        if (error) throw error;
        
        // Combine the database data with the local storage data
        const postsWithDetails = data.map(dbPost => {
          const localPost = userPosts.find(p => p.id === dbPost.id);
          return {
            ...dbPost,
            anonymousId: localPost?.anonymousId
          };
        });
        
        setPostDetails(postsWithDetails);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError('Failed to load your posts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPosts();
  }, [userPosts]); // ← Note the dependency change

  // Function to handle post deletion
  const handleDelete = async (postId, anonymousId) => {
    if (deleteConfirm === postId) {
      try {
        // Set the anonymous ID as a configuration parameter
        await supabase.rpc('set_config', {
          parameter: 'app.anonymous_id',
          value: anonymousId
        });
        
        // Perform the delete operation
        const { error } = await supabase
          .from('Posts')
          .delete()
          .eq('id', postId)
          .eq('anonymous_id', anonymousId);
        
        if (error) throw error;
        
        // Remove the post from local storage
        removePost(postId);
        
        // Reset delete confirmation
        setDeleteConfirm(null);
      } catch (err) {
        console.error('Error deleting post:', err);
        alert('Failed to delete post. Please try again.');
      }
    } else {
      // First click - show confirmation
      setDeleteConfirm(postId);
    }
  };

  // Function to navigate to edit page
  const handleEdit = (post) => {
    // Store the post details in localStorage for the edit page
   AppStorage.setItem('editPost', {
  id: post.id,
  anonymousId: post.anonymousId,
  title: post.title,
  description: post.description,
  contentType: post.content_type,
  offerType: post.offer_type,
});
    
    navigate(`/post/edit/${post.id}`);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <Link to="/" className="flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-4">
          <ArrowLeft size={16} className="mr-2" />
          Back to Listings
        </Link>
        <h1 className="text-3xl font-bold mb-2">My Posts</h1>
        <p className="text-gray-600 mb-6">
          Manage the posts you've created on this device
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      ) : postDetails.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-2xl font-semibold text-gray-700 mb-3">No Posts Yet</h3>
          <p className="text-xl text-gray-600 mb-6">You haven't created any posts on this device</p>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            When you create posts on the Ridgewood Exchange, they'll appear here for you to manage.
          </p>
          <Link 
            to="/post" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Create Your First Post
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {postDetails.map(post => (
            <div key={post.id} className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="bg-white p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="mb-1">
                      <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full text-white mr-2 ${
                        post.offer_type === 'offering' ? 'bg-blue-500' : 'bg-purple-500'
                      }`}>
                        {post.offer_type === 'offering' ? 'Offering' : 'Requesting'}
                      </span>
                      <span className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-700">
                        {post.content_type === 'item' ? 'Item' : 'Service'}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{post.title}</h2>
                    <p className="text-sm text-gray-500 mt-1 flex items-center">
                      <Clock size={14} className="mr-1" />
                      Posted {formatDate(post.created_at)}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(post)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(post.id, post.anonymousId)}
                      className={`p-2 ${
                        deleteConfirm === post.id 
                          ? 'text-white bg-red-500 hover:bg-red-600' 
                          : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                      } rounded-full transition-colors`}
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                </div>
                
                <p className="text-gray-700 mt-3 line-clamp-2">{post.description}</p>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.category && (
                    <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                      {post.category}
                    </span>
                  )}
                  {post.condition && (
                    <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                      {post.condition}
                    </span>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
                  <Link
                    to={`/post/${post.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    View Post
                  </Link>
                  {deleteConfirm === post.id && (
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPostsPage;