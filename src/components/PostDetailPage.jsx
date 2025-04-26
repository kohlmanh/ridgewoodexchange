import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, DollarSign, Users, Info, ThumbsUp, MessageCircle, ArrowLeft, Share } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
// Import the Comments component
import Comments from './Comments';

const PostDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showShareOptions, setShowShareOptions] = useState(false);

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
    const fetchPost = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('Posts')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        
        if (data) {
          setPost(data);
        } else {
          setError('Post not found');
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        setError('Error loading post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
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

  // Handle like button click
  const handleLike = async () => {
    try {
      // Update the likes count in the database
      const { error } = await supabase.rpc('increment_like_count', { post_id: id });
      
      if (error) throw error;
      
      // Update local state
      setPost(prev => ({ ...prev, likes: (prev.likes || 0) + 1 }));
    } catch (error) {
      console.error('Error liking post:', error);
      alert('Failed to like post. Please try again.');
    }
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
        {/* Left Column: Image or placeholder */}
        <div className="md:col-span-1">
          {post.image_url ? (
            <div className="rounded-lg overflow-hidden border border-gray-200">
              <img 
                src={post.image_url} 
                alt={post.title} 
                className="w-full h-auto object-cover"
              />
            </div>
          ) : (
            <div className="h-48 sm:h-64 rounded-lg flex items-center justify-center" 
              style={{ backgroundColor: post.content_type === 'item' ? colors.itemRow : colors.serviceRow }}
            >
              <div className="text-5xl sm:text-6xl" style={{ color: post.offer_type === 'offering' ? colors.offering : colors.requesting }}>
                {post.content_type === 'item' ? '📦' : '🔧'}
              </div>
            </div>
          )}

          {/* Social Interactions */}
          <div className="flex justify-between items-center mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <button
                onClick={handleLike}
                className="flex items-center px-3 py-1 rounded-full hover:bg-gray-100"
              >
                <ThumbsUp size={18} className="mr-1 text-gray-400" />
                <span className="text-gray-600">{post.likes || 0}</span>
              </button>
            </div>
            <div className="flex items-center">
              <MessageCircle size={18} className="mr-1 text-gray-400" />
              <span className="text-gray-600">{post.comments || 0}</span>
            </div>
            <div className="relative">
              <button
                onClick={handleShare}
                className="flex items-center px-3 py-1 rounded-full hover:bg-gray-100"
              >
                <Share size={18} className="text-gray-400" />
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

          {/* Contact Information */}
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
                  <button 
                    className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full"
                    onClick={() => alert('In a full implementation, this would send a message to the poster!')}
                  >
                    I'm Interested
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Comments Section - Add this section */}
          <Comments postId={id} />
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;