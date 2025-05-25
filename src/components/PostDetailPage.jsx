// Integrated PostDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, DollarSign, Users, Info, ArrowLeft, Share, MapPin, User } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
// Import the Comments component
import PostComments from './PostComments';  // ✅ Correct
import InterestedButton from './InterestedButton';

const PostDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [images, setImages] = useState([]);
  const [postOwner, setPostOwner] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Define theme colors to match your other components
  const colors = {
    primary: '#0052cc',
    primaryLight: '#e6f0ff',
    primaryDark: '#003d99',
    accent: '#4d94ff',
    white: '#ffffff',
    lightGray: '#f5f7fa',
    mediumGray: '#e1e5eb',
    darkGray: '#4a5568',
    textPrimary: '#2d3748',
    textSecondary: '#718096',
    offering: '#0052cc', // Blue for offerings
    requesting: '#9254de', // Purple for requesting
    itemRow: '#f0f7ff', // Light blue for item rows
    serviceRow: '#f8f9fa' // Light gray for service rows
  };

  useEffect(() => {
    const fetchPostData = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: userData } = await supabase.auth.getUser();
        setCurrentUser(userData.user);
        
        // Fetch post details
        const { data: postData, error: postError } = await supabase
          .from('Posts')
          .select('*')
          .eq('id', id)
          .single();
          
        if (postError) throw postError;
        
        setPost(postData);
        
        // Fetch post images
        const { data: imagesData, error: imagesError } = await supabase
          .from('PostImages')
          .select('*')
          .eq('post_id', id)
          .order('order', { ascending: true });
          
        if (imagesError) throw imagesError;
        
        // If we have images, use them; otherwise, use the legacy image_url
        if (imagesData && imagesData.length > 0) {
          setImages(imagesData.map(img => img.image_url));
        } else if (postData.image_url) {
          setImages([postData.image_url]);
        }
        
        // Fetch post owner details
        if (postData.user_id) {
          const { data: ownerData } = await supabase
            .from('profiles')
            .select('username, full_name, avatar_url')
            .eq('id', postData.user_id)
            .single();
            
          setPostOwner(ownerData);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching post details:', err);
        setError('Failed to load the post. It may have been removed or you may not have permission to view it.');
        setLoading(false);
      }
    };
    
    fetchPostData();
  }, [id]);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  // Handle share button click
  const handleShare = () => {
    setShowShareOptions(!showShareOptions);
  };

  const shareViaEmail = () => {
    const subject = `Check out this listing: ${post.title}`;
    const body = `I found this listing on Ridgewood Exchange and thought you might be interested:\n\n${post.title}\n\n${post.description}\n\nCheck it out at: ${window.location.href}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setShowShareOptions(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        alert('Link copied to clipboard!');
        setShowShareOptions(false);
      })
      .catch(err => {
        console.error('Failed to copy link:', err);
        alert('Failed to copy link. Please try again.');
      });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center">
          <h2 className="text-xl font-semibold">Error</h2>
          <p>{error || 'Post not found'}</p>
          <button 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => navigate('/')}
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Back button */}
      <button 
        onClick={() => navigate('/communityfeed')}
        className="flex items-center text-blue-500 hover:text-blue-700 mb-6"
      >
        <ArrowLeft size={18} className="mr-1" />
        Back to listings
      </button>

      {/* Post Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {/* Offer Type Tag */}
          <span 
            className="px-3 py-1 text-sm font-semibold rounded-full"
            style={{ 
              backgroundColor: post.offer_type === 'offering' ? colors.primaryLight : '#f9f0ff',
              color: post.offer_type === 'offering' ? colors.primaryDark : colors.requesting
            }}
          >
            {post.offer_type === 'offering' ? 'OFFERING' : 'REQUESTING'}
          </span>
          
          {/* Content Type Tag */}
          <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-600">
            {post.content_type === 'item' ? 'ITEM' : 'SERVICE'}
          </span>
          
          {/* Category Tag */}
          <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-600">
            {post.category}
          </span>
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: colors.textPrimary }}>
          {post.title}
        </h1>
        
        <div className="flex items-center mt-2 text-gray-500">
          <Clock size={16} className="mr-1" />
          <span>{formatDate(post.created_at)}</span>
        </div>
      </div>

      {/* Main Content - More responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {/* Left Column: Images or placeholder */}
        <div className="md:col-span-1">
          <div className="rounded-lg overflow-hidden border border-gray-200">
            {/* Main Image */}
            <div className="relative bg-gray-200 h-96">
              {images.length > 0 ? (
                <img 
                  src={images[0]} 
                  alt={post.title} 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <div className="text-4xl" style={{ color: post.offer_type === 'offering' ? '#0052cc' : '#9254de' }}>
                    {post.content_type === 'item' ? '📦' : '🔧'}
                  </div>
                </div>
              )}
              
              {/* Tag for item type (offering or seeking) */}
              <div className={`absolute top-4 left-4 px-4 py-2 rounded-md text-white font-medium ${
                post.offer_type === 'offering' 
                  ? post.content_type === 'item' ? 'bg-blue-600' : 'bg-green-600' 
                  : 'bg-purple-600'
              }`}>
                {post.offer_type === 'offering' 
                  ? `${post.content_type === 'service' ? 'Service' : 'Item'} for Trade` 
                  : `Wanted: ${post.content_type === 'service' ? 'Service' : 'Item'}`}
              </div>
            </div>
          </div>

          {/* Social Interactions */}
          <div className="flex justify-between items-center mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="relative ml-auto">
              <button
                onClick={handleShare}
                className="flex items-center px-3 py-1 rounded-full hover:bg-gray-100"
              >
                <Share size={18} className="text-gray-400" />
                <span className="ml-1 text-gray-600">Share</span>
              </button>
              
              {/* Share Options Dropdown */}
              {showShareOptions && (
                <div className="absolute right-0 bottom-full mb-2 bg-white shadow-lg rounded-lg w-48 overflow-hidden z-10">
                  <button 
                    onClick={copyLink}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
                  >
                    <span>Copy Link</span>
                  </button>
                  <button 
                    onClick={shareViaEmail}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
                  >
                    <span>Email</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Post Owner */}
          <div className="mt-4 p-4 bg-gray-50 border rounded-lg">
            <h2 className="font-semibold mb-2">Posted by</h2>
            <div className="flex items-center">
              {postOwner?.avatar_url ? (
                <img 
                  src={postOwner.avatar_url}
                  alt={postOwner.username || 'User'}
                  className="w-10 h-10 rounded-full mr-3 object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <User size={20} className="text-blue-600" />
                </div>
              )}
              <div>
                <p className="font-medium">
                  {postOwner?.username || postOwner?.full_name || post.user_name || 'Anonymous User'}
                </p>
              </div>
            </div>
          </div>

          {/* Interest Button */}
          {currentUser && currentUser.id === post.user_id ? (
            <div className="mt-4 bg-gray-100 text-gray-600 p-3 rounded-md text-center">
              This is your post
            </div>
          ) : (
            <div className="mt-4">
              <InterestedButton 
                postId={post.id} 
                postTitle={post.title}
                postOwnerId={post.user_id}
              />
            </div>
          )}
        </div>

        {/* Right Column: Details */}
        <div className="md:col-span-2">
          {/* Description */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3" style={{ color: colors.primary }}>
              Description
            </h2>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="whitespace-pre-line">{post.description}</p>
            </div>
          </div>

          {/* Location (if available) */}
          {post.location && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3" style={{ color: colors.primary }}>
                Location
              </h2>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="flex items-center">
                  <MapPin size={16} className="mr-1 text-gray-600" />
                  {post.location}
                </p>
              </div>
            </div>
          )}

          {/* Item-specific details */}
          {post.content_type === 'item' && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3" style={{ color: colors.primary }}>
                Item Details
              </h2>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                {post.offer_type === 'offering' && post.condition && (
                  <div className="flex items-start mb-3">
                    <Info size={18} className="mr-2 mt-1 flex-shrink-0 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Condition</p>
                      <p className="font-medium">{post.condition}</p>
                    </div>
                  </div>
                )}
                
                {post.offer_type === 'offering' && post.looking_for && (
                  <div className="flex items-start mb-3">
                    <Users size={18} className="mr-2 mt-1 flex-shrink-0 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Looking For In Exchange</p>
                      <p>{post.looking_for}</p>
                    </div>
                  </div>
                )}
                
                {post.offer_type === 'requesting' && post.can_offer && (
                  <div className="flex items-start mb-3">
                    <Users size={18} className="mr-2 mt-1 flex-shrink-0 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Can Offer In Return</p>
                      <p>{post.can_offer}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Service-specific details */}
          {post.content_type === 'service' && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3" style={{ color: colors.primary }}>
                Service Details
              </h2>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                {post.offer_type === 'offering' && post.experience_level && (
                  <div className="flex items-start mb-3">
                    <Info size={18} className="mr-2 mt-1 flex-shrink-0 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Experience Level</p>
                      <p className="font-medium">{post.experience_level}</p>
                    </div>
                  </div>
                )}
                
                {post.availability && (
                  <div className="flex items-start mb-3">
                    <Clock size={18} className="mr-2 mt-1 flex-shrink-0 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Availability</p>
                      <p>{post.availability}</p>
                    </div>
                  </div>
                )}
                
                {post.rate_type && (
                  <div className="flex items-start mb-3">
                    <DollarSign size={18} className="mr-2 mt-1 flex-shrink-0 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Exchange Preference</p>
                      <p className="font-medium">
                        {post.rate_type === 'trade' ? 'Trade/Barter' : 
                         post.rate_type === 'hourly' ? 'Time Exchange' : 'Volunteer'}
                      </p>
                      {post.rate_amount && <p>{post.rate_amount}</p>}
                      {post.rate_notes && <p className="text-sm mt-1">{post.rate_notes}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact Information (if present in your structure) */}
          {post.contact_method && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3" style={{ color: colors.primary }}>
                Contact Information
              </h2>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="mb-2">
                  <span className="font-medium">Contact via: </span>
                  {post.contact_method === 'email' ? 'Email' : 
                  post.contact_method === 'phone' ? 'Phone' : 'Email or Phone'}
                </p>
                
                {!post.is_anonymous && post.contact_info && (
                  <p>{post.contact_info}</p>
                )}
                
                {post.is_anonymous && (
                  <div className="bg-blue-50 p-3 rounded-lg mt-2">
                    <p className="text-blue-600">Contact information will be shared when you express interest</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Safety Tips */}
          <div className="p-4 mb-6 bg-blue-50 border-t rounded-lg">
            <h2 className="font-semibold mb-2 text-blue-700">Safety Tips</h2>
            <ul className="text-sm space-y-1 text-blue-900">
              <li>• Meet in public places for exchanges</li>
              <li>• Don't share personal financial information</li>
              <li>• Review the item before completing exchange</li>
              <li>• Trust your instincts</li>
            </ul>
          </div>
          
          {/* Comments Section */}
          <PostComments postId={id} />
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;