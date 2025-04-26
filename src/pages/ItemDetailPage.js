import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageCircle, Share2, Flag, User, Calendar, Tag, MapPin, ArrowLeft } from 'lucide-react';

const ItemDetailPage = () => {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [item, setItem] = useState(null);
  const [similarItems, setSimilarItems] = useState([]);
  
  useEffect(() => {
    // In a real app, this would be an API call to your Supabase database
    
    // Simulate API call
    setTimeout(() => {
      // Mock item data
      const mockItem = {
        id: parseInt(id),
        title: 'Vintage Record Collection',
        type: 'offering', // 'offering' or 'seeking'
        contentType: 'item', // 'item' or 'service'
        category: 'Music',
        condition: 'Good',
        description: 'Collection of 30+ vinyl records from the 70s and 80s. Mostly classic rock with some jazz and soul. All records are in good condition with minimal scratches. Original sleeves included for most. Would trade for musical instruments, audio equipment, or other interesting items.\n\nHighlights include:\n- Led Zeppelin IV\n- Pink Floyd - Dark Side of the Moon\n- Fleetwood Mac - Rumours\n- Miles Davis - Kind of Blue\n- The Beatles - Abbey Road',
        images: [
          '/api/placeholder/600/400',
          '/api/placeholder/600/400',
          '/api/placeholder/600/400'
        ],
        tags: ['music', 'vinyl', 'records', 'collectibles'],
        postedDate: '2025-03-15T10:30:00Z',
        expiryDate: '2025-04-15T10:30:00Z',
        location: 'Downtown',
        city: 'New York',
        views: 42,
        contactPreference: 'email',
        user: {
          username: 'vinylcollector',
          joinDate: 'January 2025',
          rating: 4.9,
          reviewCount: 7,
          image: '/api/placeholder/100/100',
          isVerified: true
        },
        event: {
          id: 1,
          title: 'Community Swap Meet',
          date: '2025-04-15',
          location: 'Central Park, Main Pavilion'
        }
      };
      
      // Mock similar items
      const mockSimilarItems = [
        {
          id: 101,
          title: 'Guitar Collection',
          type: 'offering',
          category: 'Music',
          condition: 'Excellent',
          image: '/api/placeholder/200/200',
          postedDate: '2025-03-18T15:20:00Z'
        },
        {
          id: 102,
          title: 'Cassette Tape Collection',
          type: 'offering',
          category: 'Music',
          condition: 'Fair',
          image: '/api/placeholder/200/200',
          postedDate: '2025-03-20T09:45:00Z'
        },
        {
          id: 103,
          title: 'Looking for Vinyl Records',
          type: 'seeking',
          category: 'Music',
          image: null,
          postedDate: '2025-03-22T14:10:00Z'
        },
        {
          id: 104,
          title: 'DJ Equipment',
          type: 'offering',
          category: 'Music',
          condition: 'Good',
          image: '/api/placeholder/200/200',
          postedDate: '2025-03-25T11:30:00Z'
        }
      ];
      
      setItem(mockItem);
      setSimilarItems(mockSimilarItems);
      setIsLoading(false);
    }, 1000);
  }, [id]);
  
  // Format date to readable format
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const postedDate = new Date(dateString);
    const diffInDays = Math.floor((now - postedDate) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };
  
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }
  
  if (!item) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-700">Item not found</h2>
        <p className="mt-2 text-gray-500">The item you're looking for doesn't exist or has been removed.</p>
        <Link to="/" className="mt-6 inline-block text-blue-600 hover:underline">
          Browse all items
        </Link>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto">
      {/* Navigation back */}
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft size={18} className="mr-2" />
          Back to listings
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Item Images and Details - Left/Top Section */}
        <div className="lg:col-span-2">
          {/* Item Images */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            {/* Main Image */}
            <div className="relative bg-gray-200 h-96">
              <img 
                src={item.images[activeImageIndex]} 
                alt={item.title} 
                className="w-full h-full object-contain"
              />
              
              {/* Tag for item type (offering or seeking) */}
              <div className={`absolute top-4 left-4 px-4 py-2 rounded-md text-white font-medium ${
                item.type === 'offering' 
                  ? item.contentType === 'item' ? 'bg-blue-600' : 'bg-green-600' 
                  : 'bg-purple-600'
              }`}>
                {item.type === 'offering' 
                  ? `${item.contentType === 'service' ? 'Service' : 'Item'} for Trade` 
                  : `Wanted: ${item.contentType === 'service' ? 'Service' : 'Item'}`}
              </div>
            </div>
            
            {/* Thumbnail Images */}
            {item.images.length > 1 && (
              <div className="p-4 flex gap-2 overflow-x-auto">
                {item.images.map((image, index) => (
                  <button 
                    key={index}
                    className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 ${
                      index === activeImageIndex ? 'border-blue-500' : 'border-transparent'
                    }`}
                    onClick={() => setActiveImageIndex(index)}
                  >
                    <img 
                      src={image} 
                      alt={`${item.title} - view ${index + 1}`} 
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Item Details */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{item.title}</h1>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6">
              {item.condition && (
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                  Condition: {item.condition}
                </span>
              )}
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                Category: {item.category}
              </span>
              <span className="text-gray-500 text-sm">
                <Calendar size={16} className="inline mr-1" />
                Posted: {formatTimeAgo(item.postedDate)}
              </span>
              <span className="text-gray-500 text-sm">
                <MapPin size={16} className="inline mr-1" />
                {item.location}, {item.city}
              </span>
            </div>
            
            <h2 className="text-xl font-bold text-gray-800 mb-3">Description</h2>
            <div className="text-gray-700 space-y-4 mb-6">
              {item.description.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            
            {/* Tags */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-3">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag, index) => (
                  <Link key={index} to={`/?tag=${tag}`} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200">
                    <Tag size={14} className="inline mr-1" />
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
            
            {/* Associated Event */}
            {item.event && (
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-3">Associated Event</h2>
                <Link to={`/events/${item.event.id}`} className="block bg-blue-50 rounded-lg p-4 hover:bg-blue-100">
                  <h3 className="font-semibold text-blue-800">{item.event.title}</h3>
                  <div className="flex flex-wrap text-blue-700 text-sm mt-1">
                    <span className="mr-4">
                      <Calendar size={14} className="inline mr-1" />
                      {formatDate(item.event.date)}
                    </span>
                    <span>
                      <MapPin size={14} className="inline mr-1" />
                      {item.event.location}
                    </span>
                  </div>
                </Link>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button className="px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700">
                <MessageCircle size={18} className="inline mr-2" />
                Contact {item.user.username}
              </button>
              <button className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50">
                <Share2 size={18} className="inline mr-2" />
                Share
              </button>
              <button className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50">
                <Flag size={18} className="inline mr-2" />
                Report
              </button>
            </div>
          </div>
        </div>
        
        {/* User Info and Similar Items - Right/Bottom Section */}
        <div>
          {/* User Info */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center mb-4">
              <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-200 mr-4">
                <img 
                  src={item.user.image} 
                  alt={item.user.username} 
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center">
                  <h2 className="font-bold text-gray-800 mr-2">{item.user.username}</h2>
                  {item.user.isVerified && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-sm">Member since {item.user.joinDate}</p>
                <div className="flex items-center mt-1">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg 
                        key={i} 
                        className={`w-4 h-4 ${i < Math.floor(item.user.rating) ? 'text-yellow-400' : 'text-gray-300'}`} 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="ml-1 text-gray-500 text-sm">
                    ({item.user.reviewCount} reviews)
                  </span>
                </div>
              </div>
            </div>
            
            <Link 
              to={`/profile/${item.user.username}`}
              className="block w-full text-center py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50"
            >
              <User size={16} className="inline mr-2" />
              View Profile
            </Link>
          </div>
          
          {/* Similar Items */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Similar Items</h2>
            {similarItems.length === 0 ? (
              <p className="text-gray-500">No similar items found.</p>
            ) : (
              <div className="space-y-4">
                {similarItems.map(similarItem => (
                  <Link 
                    key={similarItem.id} 
                    to={`/items/${similarItem.id}`}
                    className="flex bg-gray-50 rounded-lg overflow-hidden hover:bg-gray-100 transition-colors"
                  >
                    {similarItem.image ? (
                      <div className="flex-shrink-0 w-20 h-20 bg-gray-200">
                        <img src={similarItem.image} alt={similarItem.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-20 h-20 bg-gray-200 flex items-center justify-center">
                        <Tag size={24} className="text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-800 truncate">{similarItem.title}</h3>
                          <div className="flex text-xs text-gray-500 mt-1">
                            <span>{similarItem.category}</span>
                            {similarItem.condition && (
                              <span className="ml-2 pl-2 border-l border-gray-300">{similarItem.condition}</span>
                            )}
                          </div>
                        </div>
                        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                          similarItem.type === 'offering' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {similarItem.type === 'offering' ? 'Offering' : 'Seeking'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailPage;