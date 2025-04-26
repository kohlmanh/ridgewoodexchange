import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Users, MessageCircle, Share2, ThumbsUp, ChevronRight } from 'lucide-react';

const EventDetailPage = () => {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [relatedItems, setRelatedItems] = useState([]);
  const [isAttending, setIsAttending] = useState(false);
  
  useEffect(() => {
    // In a real app, this would be an API call to your Supabase database
    
    // Simulate API call
    setTimeout(() => {
      // Mock event data
      const mockEvent = {
        id: parseInt(id),
        title: 'Community Swap Meet',
        date: '2025-04-15',
        startTime: '10:00 AM',
        endTime: '3:00 PM',
        location: 'Central Park, Main Pavilion',
        address: '5th Ave & 69th St',
        city: 'New York',
        state: 'NY',
        zipCode: '10021',
        description: 'Bring your items to trade and meet local community members! We\'ll have tables set up and volunteers to help facilitate exchanges. This is a great opportunity to find unique items, reduce waste, and connect with others who share your interests in sustainable living and community building.\n\nAll types of items are welcome, but please ensure they are in good, working condition. This is a family-friendly event!',
        guidelines: [
          'All items should be clean and in working condition',
          'No cash sales - this is a trading event only',
          'Be respectful of others and their belongings',
          'Sign up for a table in advance if you plan to bring many items',
          'Label your items with what you\'re looking to trade for (optional)',
          'Children must be supervised at all times'
        ],
        category: 'general',
        attendees: 25,
        capacity: 75,
        organizer: {
          username: 'communityswap',
          name: 'Community Swap Organization',
          image: '/api/placeholder/100/100'
        },
        image: '/api/placeholder/800/400',
        tags: ['general', 'community', 'sustainable']
      };
      
      // Mock related items
      const mockRelatedItems = [
        {
          id: 1,
          title: 'Vintage Record Collection',
          type: 'offering',
          category: 'Music',
          condition: 'Good',
          description: 'Collection of 30+ vinyl records from the 70s and 80s.',
          image: '/api/placeholder/200/200',
          user: 'vinylcollector',
          eventId: parseInt(id)
        },
        {
          id: 2,
          title: 'Mountain Bike',
          type: 'offering',
          category: 'Sports',
          condition: 'Excellent',
          description: 'Trek mountain bike, barely used, perfect condition.',
          image: '/api/placeholder/200/200',
          user: 'bikeenthusiast',
          eventId: parseInt(id)
        },
        {
          id: 3,
          title: 'Looking for Camping Gear',
          type: 'seeking',
          category: 'Outdoors',
          description: 'Planning a trip and need tent, sleeping bags, and other camping equipment.',
          user: 'natureexplorer',
          eventId: parseInt(id)
        },
        {
          id: 4,
          title: 'Handyman Services',
          type: 'offering',
          category: 'Home Repair',
          description: 'Offering basic home repair services. Can fix furniture, do small electrical work, etc.',
          user: 'handyperson',
          eventId: parseInt(id)
        }
      ];
      
      setEvent(mockEvent);
      setRelatedItems(mockRelatedItems);
      setIsLoading(false);
    }, 1000);
  }, [id]);
  
  // Format date to readable format
  const formatDate = (dateString) => {
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  const handleAttendClick = () => {
    // In a real app, this would make an API call to update your Supabase database
    setIsAttending(!isAttending);
    
    if (!isAttending) {
      setEvent(prev => ({
        ...prev,
        attendees: prev.attendees + 1
      }));
    } else {
      setEvent(prev => ({
        ...prev,
        attendees: prev.attendees - 1
      }));
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }
  
  if (!event) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-700">Event not found</h2>
        <p className="mt-2 text-gray-500">The event you're looking for doesn't exist or has been removed.</p>
        <Link to="/events" className="mt-6 inline-block text-blue-600 hover:underline">
          Browse all events
        </Link>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto">
      {/* Event Header */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        {/* Event Image */}
        <div className="relative h-64 md:h-96 w-full bg-gray-200">
          <img 
            src={event.image} 
            alt={event.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-6 text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{event.title}</h1>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center">
                <Calendar size={20} className="mr-2" />
                <span>{formatDate(event.date)}</span>
              </div>
              <div className="flex items-center">
                <Clock size={20} className="mr-2" />
                <span>{event.startTime} - {event.endTime}</span>
              </div>
              <div className="flex items-center">
                <Users size={20} className="mr-2" />
                <span>{event.attendees} attending</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Bar */}
        <div className="border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between p-4">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-200 mr-3">
                <img 
                  src={event.organizer.image} 
                  alt={event.organizer.name} 
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="text-gray-700 font-medium">{event.organizer.name}</p>
                <p className="text-gray-500 text-sm">Organizer</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button 
                className={`px-4 py-2 rounded-md font-medium ${
                  isAttending 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
                onClick={handleAttendClick}
              >
                {isAttending ? 'Cancel Attendance' : 'Attend Event'}
              </button>
              
              <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50">
                <MessageCircle size={18} className="inline mr-2" />
                Contact
              </button>
              
              <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50">
                <Share2 size={18} className="inline mr-2" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Event Details - Left Column */}
        <div className="lg:col-span-2">
          {/* About */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">About This Event</h2>
            <div className="text-gray-700 space-y-4">
              {event.description.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
          
          {/* Guidelines */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Event Guidelines</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              {event.guidelines.map((guideline, index) => (
                <li key={index}>{guideline}</li>
              ))}
            </ul>
          </div>
          
          {/* Items for this Event */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Items for this Event</h2>
              <Link to={`/post-item?eventId=${event.id}`} className="text-blue-600 hover:underline font-medium">
                Post an Item
              </Link>
            </div>
            
            {relatedItems.length === 0 ? (
              <p className="text-gray-500">
                No items have been posted for this event yet. Be the first to post!
              </p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {relatedItems.map(item => (
                  <Link key={item.id} to={`/items/${item.id}`} className="flex bg-gray-50 rounded-lg overflow-hidden hover:bg-gray-100 transition-colors">
                    {item.image && (
                      <div className="flex-shrink-0 w-20 h-20 bg-gray-200">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-800">{item.title}</h3>
                          <p className="text-xs text-gray-500">by {item.user}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.type === 'offering' 
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {item.type === 'offering' ? 'Offering' : 'Seeking'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            
            {relatedItems.length > 0 && (
              <div className="mt-4 text-center">
                <Link to={`/items?eventId=${event.id}`} className="inline-flex items-center text-blue-600 hover:underline font-medium">
                  View all items
                  <ChevronRight size={16} className="ml-1" />
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Event Info - Right Column */}
        <div className="lg:col-span-1">
          {/* Event Details */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Event Details</h2>
            
            <div className="space-y-4">
              {/* Date & Time */}
              <div>
                <h3 className="font-medium text-gray-700 mb-1">Date & Time</h3>
                <div className="flex items-start text-gray-600">
                  <Calendar size={18} className="flex-shrink-0 mr-2 mt-0.5" />
                  <div>
                    <div>{formatDate(event.date)}</div>
                    <div>{event.startTime} - {event.endTime}</div>
                  </div>
                </div>
              </div>
              
              {/* Location */}
              <div>
                <h3 className="font-medium text-gray-700 mb-1">Location</h3>
                <div className="flex items-start text-gray-600">
                  <MapPin size={18} className="flex-shrink-0 mr-2 mt-0.5" />
                  <div>
                    <div>{event.location}</div>
                    <div>{event.address}</div>
                    <div>{event.city}, {event.state} {event.zipCode}</div>
                  </div>
                </div>
              </div>
              
              {/* Capacity */}
              <div>
                <h3 className="font-medium text-gray-700 mb-1">Capacity</h3>
                <div className="flex items-center text-gray-600">
                  <Users size={18} className="mr-2" />
                  <div>
                    <span>{event.attendees}</span>
                    <span className="text-gray-400"> / {event.capacity} attendees</span>
                  </div>
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${(event.attendees / event.capacity) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Tags */}
              <div>
                <h3 className="font-medium text-gray-700 mb-1">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag, index) => (
                    <Link key={index} to={`/events?tag=${tag}`} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200">
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Map - would integrate with Google Maps in a real app */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Location</h2>
            <div className="aspect-video bg-gray-200 rounded-md flex items-center justify-center">
              <MapPin size={36} className="text-gray-400" />
              <span className="ml-2 text-gray-500">Map would go here</span>
            </div>
            <a 
              href={`https://maps.google.com/?q=${event.address}, ${event.city}, ${event.state} ${event.zipCode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-blue-600 hover:underline"
            >
              View on Google Maps
            </a>
          </div>
          
          {/* Share & Like */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-around">
              <button className="flex flex-col items-center text-gray-600 hover:text-blue-600">
                <Share2 size={24} className="mb-1" />
                <span className="text-sm">Share</span>
              </button>
              <button className="flex flex-col items-center text-gray-600 hover:text-red-600">
                <ThumbsUp size={24} className="mb-1" />
                <span className="text-sm">Like</span>
              </button>
              <Link to="/events" className="flex flex-col items-center text-gray-600 hover:text-green-600">
                <Calendar size={24} className="mb-1" />
                <span className="text-sm">More Events</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;