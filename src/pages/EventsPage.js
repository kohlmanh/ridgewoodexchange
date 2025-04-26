import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Search, Filter, Plus } from 'lucide-react';

const EventsPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  
  // Fetch events data
  useEffect(() => {
    // In a real app, this would be an API call to your Supabase database
    
    // Simulate API call
    setTimeout(() => {
      // Mock events data
      const mockEvents = [
        {
          id: 1,
          title: 'Community Swap Meet',
          date: '2025-04-15',
          location: 'Central Park, Main Pavilion',
          city: 'New York',
          description: 'Bring your items to trade and meet local community members! We\'ll have tables set up and volunteers to help facilitate exchanges.',
          category: 'general',
          attendees: 25,
          organizer: 'communityswap',
          image: '/api/placeholder/400/200'
        },
        {
          id: 2,
          title: 'Book & Media Exchange',
          date: '2025-04-22',
          location: 'Public Library, Conference Room A',
          city: 'Boston',
          description: 'Special focus on books, movies, music, and video games. Trading only, no selling allowed.',
          category: 'specialty',
          attendees: 18,
          organizer: 'booklovers',
          image: '/api/placeholder/400/200'
        },
        {
          id: 3,
          title: 'Garden & Plant Swap',
          date: '2025-05-01',
          location: 'Community Garden',
          city: 'Portland',
          description: 'Exchange plants, seeds, and gardening supplies with fellow gardeners. Master gardeners will be available for questions.',
          category: 'specialty',
          attendees: 12,
          organizer: 'greenthumb',
          image: '/api/placeholder/400/200'
        },
        {
          id: 4,
          title: 'Kids Clothing & Toy Exchange',
          date: '2025-05-08',
          location: 'Recreation Center, Main Hall',
          city: 'Denver',
          description: 'Swap outgrown children\'s clothing, toys, and equipment. All items should be clean and in good condition.',
          category: 'specialty',
          attendees: 30,
          organizer: 'parentnetwork',
          image: '/api/placeholder/400/200'
        },
        {
          id: 5,
          title: 'Tech Swap',
          date: '2025-05-15',
          location: 'Innovation Hub, Downtown',
          city: 'Austin',
          description: 'Trading electronics, computer equipment, gadgets and tech services. Volunteer tech experts will be on hand.',
          category: 'specialty',
          attendees: 22,
          organizer: 'techxchange',
          image: '/api/placeholder/400/200'
        },
        {
          id: 6,
          title: 'Neighborhood Exchange Day',
          date: '2025-05-20',
          location: 'Sunset Park',
          city: 'Seattle',
          description: 'A general swap meet for the neighborhood. All welcome! Tables provided on first-come basis.',
          category: 'general',
          attendees: 40,
          organizer: 'seattleswaps',
          image: '/api/placeholder/400/200'
        }
      ];
      
      setEvents(mockEvents);
      setIsLoading(false);
    }, 1000);
  }, []);
  
  // Format date to readable format
  const formatDate = (dateString) => {
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Filter and search events
  const filteredEvents = events.filter(event => {
    // Apply category filter
    if (filterCategory !== 'all' && event.category !== filterCategory) {
      return false;
    }
    
    // Apply search term
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      return (
        event.title.toLowerCase().includes(searchLower) ||
        event.location.toLowerCase().includes(searchLower) ||
        event.city.toLowerCase().includes(searchLower) ||
        event.description.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
  
  // Sort events by date
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Upcoming Swap Meets</h1>
          <p className="text-gray-600 mt-2">Find and join swap meet events in your area</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Link 
            to="/create-event" 
            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium"
          >
            <Plus size={18} className="mr-2" />
            Create Event
          </Link>
        </div>
      </div>
      
      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-8">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search events by name, location, or description"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Filter */}
          <div className="flex items-center">
            <div className="flex items-center mr-2">
              <Filter size={18} className="text-gray-500 mr-1" />
              <span className="text-gray-700">Filter:</span>
            </div>
            <select
              className="border border-gray-300 rounded-md px-3 py-2"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="general">General Swap Meets</option>
              <option value="specialty">Specialty Swaps</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Event List */}
      {sortedEvents.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">No events found</h2>
          <p className="text-gray-600 mb-6">
            {searchTerm || filterCategory !== 'all' 
              ? "Try adjusting your search filters to see more results." 
              : "There are no upcoming events scheduled at this time."}
          </p>
          <Link 
            to="/create-event" 
            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium"
          >
            <Plus size={18} className="mr-2" />
            Host an Event
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedEvents.map(event => (
            <Link key={event.id} to={`/events/${event.id}`} className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* Event Image */}
              <div className="relative h-48 w-full bg-gray-200">
                <img 
                  src={event.image} 
                  alt={event.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-0 left-0 bg-blue-600 text-white px-3 py-1">
                  <Calendar size={16} className="inline mr-1" />
                  {formatDate(event.date)}
                </div>
              </div>
              
              {/* Event Details */}
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-2">{event.title}</h2>
                
                <div className="mb-4">
                  <div className="flex items-start text-gray-600 mb-1">
                    <MapPin size={18} className="flex-shrink-0 mr-2 mt-0.5" />
                    <span>{event.location}, {event.city}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users size={18} className="mr-2" />
                    <span>{event.attendees} attending</span>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-6 line-clamp-3">{event.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Organized by <span className="font-medium">{event.organizer}</span>
                  </span>
                  <span className="text-blue-600 font-medium text-sm">View Details</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      
      {/* Pagination - would implement in a real app */}
      {sortedEvents.length > 0 && (
        <div className="flex justify-center mt-12">
          <nav className="flex items-center">
            <button className="px-3 py-1 border border-gray-300 rounded-l-md hover:bg-gray-50" disabled>
              Previous
            </button>
            <button className="px-3 py-1 border border-gray-300 bg-blue-50 text-blue-600 font-medium">
              1
            </button>
            <button className="px-3 py-1 border border-gray-300 hover:bg-gray-50">
              2
            </button>
            <button className="px-3 py-1 border border-gray-300 hover:bg-gray-50">
              3
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-r-md hover:bg-gray-50">
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default EventsPage;