import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Settings, Star, Calendar, Package, Wrench, ChevronRight } from 'lucide-react';

const ProfilePage = () => {
  const { username } = useParams();
  const [activeTab, setActiveTab] = useState('items');
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  
  // Mock data
  const [userItems, setUserItems] = useState([]);
  const [userServices, setUserServices] = useState([]);
  const [userEvents, setUserEvents] = useState([]);
  
  // Check if profile belongs to logged in user
  const isOwnProfile = true; // In real app, compare to current logged in user
  
  useEffect(() => {
    // Fetch user data, items, services, events
    // In a real app, this would come from your Supabase database
    
    // Simulate API call
    setTimeout(() => {
      // Mock user data
      setUserData({
        username: username,
        joinDate: 'March 2025',
        bio: 'I love trading vintage items and offering handyman services in my community.',
        rating: 4.8,
        reviewCount: 12,
        image: '/api/placeholder/200/200'
      });
      
      // Mock user items
      setUserItems([
        {
          id: 1,
          title: 'Vintage Record Player',
          type: 'offering',
          category: 'Electronics',
          condition: 'Good',
          postedDate: '2025-03-15',
          image: '/api/placeholder/100/100'
        },
        {
          id: 2,
          title: 'Mountain Bike',
          type: 'offering',
          category: 'Sports',
          condition: 'Excellent',
          postedDate: '2025-03-20',
          image: '/api/placeholder/100/100'
        },
        {
          id: 3,
          title: 'Looking for Camping Gear',
          type: 'seeking',
          category: 'Outdoors',
          postedDate: '2025-03-18'
        }
      ]);
      
      // Mock user services
      setUserServices([
        {
          id: 1,
          title: 'Handyman Services',
          type: 'offering',
          category: 'Home Repair',
          experienceLevel: 'Advanced',
          postedDate: '2025-03-10'
        },
        {
          id: 2,
          title: 'Dog Walking',
          type: 'offering',
          category: 'Pet Care',
          experienceLevel: 'Intermediate',
          postedDate: '2025-03-05'
        }
      ]);
      
      // Mock user events
      setUserEvents([
        {
          id: 1,
          title: 'Community Swap Meet',
          date: '2025-04-15',
          location: 'Central Park',
          role: 'Attending'
        },
        {
          id: 2,
          title: 'Book & Media Exchange',
          date: '2025-04-22',
          location: 'Public Library',
          role: 'Organizing'
        }
      ]);
      
      setIsLoading(false);
    }, 1000);
  }, [username]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }
  
  if (!userData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-700">User not found</h2>
        <p className="mt-2 text-gray-500">The user you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center md:items-start">
          {/* Profile Image */}
          <div className="mb-4 md:mb-0 md:mr-6">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
              <img 
                src={userData.image} 
                alt={userData.username} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{userData.username}</h1>
                <p className="text-gray-500">Member since {userData.joinDate}</p>
              </div>
              
              {isOwnProfile && (
                <Link 
                  to="/settings" 
                  className="mt-3 md:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Settings size={18} className="mr-2" />
                  Edit Profile
                </Link>
              )}
            </div>
            
            {/* Rating */}
            <div className="flex items-center justify-center md:justify-start mt-3">
              <Star className="w-5 h-5 text-yellow-500 fill-current" />
              <span className="ml-1 font-semibold">{userData.rating}</span>
              <span className="ml-1 text-gray-500">({userData.reviewCount} reviews)</span>
            </div>
            
            {/* Bio */}
            <p className="mt-3 text-gray-700">{userData.bio}</p>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              className={`px-4 py-4 text-sm font-medium ${activeTab === 'items' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('items')}
            >
              <Package size={16} className="inline mr-1" />
              Items ({userItems.length})
            </button>
            <button
              className={`px-4 py-4 text-sm font-medium ${activeTab === 'services' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('services')}
            >
              <Wrench size={16} className="inline mr-1" />
              Services ({userServices.length})
            </button>
            <button
              className={`px-4 py-4 text-sm font-medium ${activeTab === 'events' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('events')}
            >
              <Calendar size={16} className="inline mr-1" />
              Events ({userEvents.length})
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="p-4">
          {/* Items Tab */}
          {activeTab === 'items' && (
            <div>
              {userItems.length === 0 ? (
                <p className="text-center py-6 text-gray-500">
                  {isOwnProfile ? "You haven't posted any items yet." : "This user hasn't posted any items yet."}
                </p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {userItems.map(item => (
                    <li key={item.id} className="py-4">
                      <Link to={`/items/${item.id}`} className="flex items-center hover:bg-gray-50 p-2 rounded-md">
                        {/* Item Image */}
                        {item.image && (
                          <div className="mr-4 flex-shrink-0 w-16 h-16 bg-gray-100 rounded overflow-hidden">
                            <img src={item.image} alt={item.title} className="w-full h-full object-cover"/>
                          </div>
                        )}
                        
                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center">
                            <h3 className="text-sm font-medium text-gray-900 truncate">{item.title}</h3>
                            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                              item.type === 'offering' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                            }`}>
                              {item.type === 'offering' ? 'Offering' : 'Seeking'}
                            </span>
                          </div>
                          <div className="mt-1 flex text-xs text-gray-500">
                            <span>{item.category}</span>
                            {item.condition && (
                              <span className="ml-2 pl-2 border-l border-gray-300">{item.condition}</span>
                            )}
                            <span className="ml-2 pl-2 border-l border-gray-300">
                              Posted: {new Date(item.postedDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        {/* Arrow */}
                        <ChevronRight size={16} className="text-gray-400" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              
              {isOwnProfile && (
                <div className="mt-4 text-center">
                  <Link
                    to="/post-item?contentType=item"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    Post New Item
                  </Link>
                </div>
              )}
            </div>
          )}
          
          {/* Services Tab */}
          {activeTab === 'services' && (
            <div>
              {userServices.length === 0 ? (
                <p className="text-center py-6 text-gray-500">
                  {isOwnProfile ? "You haven't posted any services yet." : "This user hasn't posted any services yet."}
                </p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {userServices.map(service => (
                    <li key={service.id} className="py-4">
                      <Link to={`/items/${service.id}`} className="flex items-center hover:bg-gray-50 p-2 rounded-md">
                        {/* Service Icon */}
                        <div className="mr-4 flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <Wrench size={24} className="text-green-600" />
                        </div>
                        
                        {/* Service Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center">
                            <h3 className="text-sm font-medium text-gray-900 truncate">{service.title}</h3>
                            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                              service.type === 'offering' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                            }`}>
                              {service.type === 'offering' ? 'Offering' : 'Seeking'}
                            </span>
                          </div>
                          <div className="mt-1 flex text-xs text-gray-500">
                            <span>{service.category}</span>
                            {service.experienceLevel && (
                              <span className="ml-2 pl-2 border-l border-gray-300">{service.experienceLevel}</span>
                            )}
                            <span className="ml-2 pl-2 border-l border-gray-300">
                              Posted: {new Date(service.postedDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        {/* Arrow */}
                        <ChevronRight size={16} className="text-gray-400" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              
              {isOwnProfile && (
                <div className="mt-4 text-center">
                  <Link
                    to="/post-item?contentType=service"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    Post New Service
                  </Link>
                </div>
              )}
            </div>
          )}
          
          {/* Events Tab */}
          {activeTab === 'events' && (
            <div>
              {userEvents.length === 0 ? (
                <p className="text-center py-6 text-gray-500">
                  {isOwnProfile ? "You're not attending any events yet." : "This user isn't attending any events yet."}
                </p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {userEvents.map(event => (
                    <li key={event.id} className="py-4">
                      <Link to={`/events/${event.id}`} className="flex items-center hover:bg-gray-50 p-2 rounded-md">
                        {/* Event Icon */}
                        <div className="mr-4 flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Calendar size={24} className="text-blue-600" />
                        </div>
                        
                        {/* Event Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center">
                            <h3 className="text-sm font-medium text-gray-900 truncate">{event.title}</h3>
                            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                              event.role === 'Organizing' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {event.role}
                            </span>
                          </div>
                          <div className="mt-1 flex text-xs text-gray-500">
                            <span>{new Date(event.date).toLocaleDateString()}</span>
                            <span className="ml-2 pl-2 border-l border-gray-300">{event.location}</span>
                          </div>
                        </div>
                        
                        {/* Arrow */}
                        <ChevronRight size={16} className="text-gray-400" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              
              {isOwnProfile && (
                <div className="mt-4 text-center">
                  <Link
                    to="/events"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    Find Events
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;