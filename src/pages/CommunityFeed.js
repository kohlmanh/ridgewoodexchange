import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Tag, Clock, DollarSign, Users, Info, MessageCircle, ThumbsUp } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
// Import from the components directory
import EnhancedFilters from '../components/EnhancedFilters';

const CommunityFeed = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Add new state variables for enhanced filtering
  const [contentTypeFilter, setContentTypeFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  // Define theme colors to match your post page
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

  // Item categories from the post page
  const itemCategories = [
    'Books & Media', 'Clothing', 'Electronics', 'Furniture', 
    'Garden', 'Home Goods', 'Kids & Toys', 'Music', 'Outdoors', 
    'Pet Supplies', 'Sports', 'Tools', 'Other'
  ];

  // Service categories from the post page
  const serviceCategories = [
    'Education & Tutoring', 'Home Repair', 'Computer & Tech Support',
    'Creative & Design', 'Health & Wellness', 'Events & Entertainment',
    'Professional Services', 'Crafts & Handmade', 'Transportation',
    'Cleaning & Organization', 'Pet Care', 'Yard & Garden Work', 'Other'
  ];

  useEffect(() => {
    fetchPosts();
    
    // Create and subscribe to a channel for the Posts table
    const channel = supabase.channel('posts-channel');
    
    // Set up the subscription for INSERT events on the Posts table
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Posts'
        },
        (payload) => {
          console.log('New post received:', payload);
          // Add the new post to the top of the posts list
          setPosts(currentPosts => [payload.new, ...currentPosts]);
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to Posts table changes');
        }
        
        if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to Posts table changes');
        }
      });
    
    // Cleanup subscription on component unmount
    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Fetch posts from Supabase
  const fetchPosts = async () => {
    setLoading(true);
    try {
      // Query posts table and order by created_at in descending order (newest first)
      const { data, error } = await supabase
      .from('Posts')  // Capital 'P' to match your table name
      .select('*')
      .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching posts:', error);
        setPosts([]);
      } else {
        setPosts(data || []);
      }
    } catch (error) {
      console.error('Unexpected error fetching posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Updated filter function to include content type
  const filteredPosts = posts.filter(post => {
    // Filter by offer type (offering, requesting, or all)
    const matchesOfferType = activeFilter === 'all' || post.offer_type === activeFilter;
    
    // Filter by search term (title or description)
    const matchesSearch = searchTerm === '' || 
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      post.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by category
    const matchesCategory = categoryFilter === '' || post.category === categoryFilter;
    
    // Filter by content type (item, service, or all)
    const matchesContentType = contentTypeFilter === 'all' || post.content_type === contentTypeFilter;
    
    return matchesOfferType && matchesSearch && matchesCategory && matchesContentType;
  });

  // Add sorting functionality
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortOrder === 'newest') {
      return new Date(b.created_at) - new Date(a.created_at);
    } else if (sortOrder === 'popular') {
      // Sort by likes + comments (total engagement)
      const aEngagement = (a.likes || 0) + (a.comments || 0);
      const bEngagement = (b.likes || 0) + (b.comments || 0);
      return bEngagement - aEngagement;
    }
    return 0;
  });

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

  // Handle click on post item
  const handlePostClick = (postId) => {
    navigate(`/post/${postId}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-4xl font-bold mb-8 text-center" style={{ color: colors.primary }}>
        Community Feed
      </h1>

      {/* Replace Filter Controls with EnhancedFilters component */}
      <EnhancedFilters 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        itemCategories={itemCategories}
        serviceCategories={serviceCategories}
        contentTypeFilter={contentTypeFilter}
        setContentTypeFilter={setContentTypeFilter}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        colors={colors}
      />

      {/* Posts - Use sortedPosts instead of filteredPosts */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : sortedPosts.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="text-xl font-semibold mb-2">No listings found</h3>
            <p className="text-gray-500">Try adjusting your filters or search term</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedPosts.map((post, index) => (
              <div 
                key={post.id}
                className="p-4 md:p-6 cursor-pointer transition-colors hover:bg-gray-50"
                style={{ 
                  backgroundColor: index % 2 === 0 ? 
                    (post.content_type === 'item' ? colors.itemRow : colors.serviceRow) : 
                    colors.white 
                }}
                onClick={() => handlePostClick(post.id)}
              >
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Left Side: Image or Icon */}
                  <div className="md:w-24 lg:w-32 flex-shrink-0">
                    {post.image_url ? (
                      <div className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center" 
                        style={{ backgroundColor: post.content_type === 'item' ? colors.itemRow : colors.serviceRow }}
                      >
                        <div className="text-3xl" style={{ color: post.offer_type === 'offering' ? colors.offering : colors.requesting }}>
                          {post.content_type === 'item' ? '📦' : '🔧'}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Main Content */}
                  <div className="flex-1">
                    {/* Top Row: Type Tags and Title - Improved mobile layout */}
                    <div className="flex flex-wrap items-start sm:items-center gap-2 mb-2">
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {/* Offer Type Tag */}
                        <span 
                          className="px-2 py-1 text-xs font-semibold rounded-full"
                          style={{ 
                            backgroundColor: post.offer_type === 'offering' ? colors.primaryLight : '#f9f0ff',
                            color: post.offer_type === 'offering' ? colors.primaryDark : colors.requesting
                          }}
                        >
                          {post.offer_type === 'offering' ? 'OFFERING' : 'REQUESTING'}
                        </span>
                        
                        {/* Content Type Tag */}
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                          {post.content_type === 'item' ? 'ITEM' : 'SERVICE'}
                        </span>
                        
                        {/* Category Tag */}
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                          {post.category}
                        </span>
                      </div>
                      
                      {/* Title - Full width on mobile */}
                      <h2 className="text-lg font-semibold w-full sm:w-auto sm:ml-auto" style={{ color: colors.textPrimary }}>
                        {post.title}
                      </h2>
                    </div>
                    
                    {/* Description */}
                    <p className="text-gray-600 mb-3 line-clamp-2">{post.description}</p>
                    
                    {/* Details Row - Better responsiveness */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                      {/* Date */}
                      <div className="flex items-center">
                        <Clock size={14} className="mr-1" />
                        <span>{formatDate(post.created_at)}</span>
                      </div>
                      
                      {/* Condition (for items) */}
                      {post.content_type === 'item' && post.offer_type === 'offering' && post.condition && (
                        <div className="flex items-center">
                          <Info size={14} className="mr-1" />
                          <span>Condition: {post.condition}</span>
                        </div>
                      )}
                      
                      {/* Rate Type (for services) */}
                      {post.content_type === 'service' && (
                        <div className="flex items-center">
                          <DollarSign size={14} className="mr-1" />
                          <span>
                            {post.rate_type === 'trade' ? 'Trade/Barter' : 
                             post.rate_type === 'hourly' ? 'Time Exchange' : 'Volunteer'}
                          </span>
                        </div>
                      )}
                      
                      {/* Looking For / Can Offer */}
                      {post.looking_for && (
                        <div className="flex items-center">
                          <Users size={14} className="mr-1" />
                          <span className="line-clamp-1">Looking for: {post.looking_for}</span>
                        </div>
                      )}
                      
                      {post.can_offer && (
                        <div className="flex items-center">
                          <Users size={14} className="mr-1" />
                          <span className="line-clamp-1">Can offer: {post.can_offer}</span>
                        </div>
                      )}
                      
                      {/* Social Stats - Stacking better on mobile */}
                      <div className="flex items-center w-full sm:w-auto sm:ml-auto mt-2 sm:mt-0 gap-4">
                        <div className="flex items-center">
                          <ThumbsUp size={14} className="mr-1" />
                          <span>{post.likes || 0}</span>
                        </div>
                        <div className="flex items-center">
                          <MessageCircle size={14} className="mr-1" />
                          <span>{post.comments || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* New Post Button (Fixed Position) */}
      <div className="fixed bottom-6 right-6 z-10">
        <button
          onClick={() => navigate('/post')}
          className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-colors focus:outline-none"
          style={{ backgroundColor: colors.primary }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CommunityFeed;