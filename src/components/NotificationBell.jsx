// NotificationBell.jsx
import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch notifications on component mount
    fetchNotifications();
    
    // Set up real-time subscription for new notifications
    const subscription = setupNotificationSubscription();
    
    // Clean up subscription when component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('UserNotifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      
      setNotifications(data || []);
      setUnreadCount(data ? data.filter(n => !n.read).length : 0);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setIsLoading(false);
    }
  };

  const setupNotificationSubscription = () => {
          return supabase
      .channel('notifications-channel')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'UserNotifications',
          filter: async () => {
            const { data } = await supabase.auth.getUser();
            return data?.user ? `recipient_id=eq.${data.user.id}` : '';
          }
        },  
        (payload) => {
          // Add new notification to state
          setNotifications(current => [payload.new, ...current]);
          setUnreadCount(count => count + 1);
        }
      )
      .subscribe();
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    
    // Mark notifications as read when dropdown is opened
    if (!isOpen && unreadCount > 0) {
      markNotificationsAsRead();
    }
  };

  const markNotificationsAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;
      
      const unreadNotificationIds = notifications
        .filter(n => !n.read)
        .map(n => n.id);
        
      if (unreadNotificationIds.length === 0) return;
      
      const { error } = await supabase
        .from('UserNotifications')
        .update({ read: true })
        .in('id', unreadNotificationIds);
        
      if (error) throw error;
      
      // Update local state
      setNotifications(current => 
        current.map(n => unreadNotificationIds.includes(n.id) ? {...n, read: true} : n)
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const getNotificationLink = (notification) => {
    switch (notification.type) {
      case 'interest':
        return `/messages?conversation=${notification.post_id}`;
      case 'comment':
        return `/post/${notification.post_id}`;
      default:
        return '#';
    }
  };

  return (
    <div className="relative">
      <button 
        className="relative p-1 rounded-full hover:bg-gray-100 transition"
        onClick={toggleDropdown}
        aria-label="Notifications"
      >
        <Bell size={20} className="text-blue-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50">
          <div className="py-2 border-b border-gray-200">
            <h3 className="px-4 font-medium text-blue-700">Notifications</h3>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : notifications.length > 0 ? (
              notifications.map(notification => (
                <Link 
                  key={notification.id}
                  to={getNotificationLink(notification)}
                  className={`block p-4 hover:bg-gray-50 border-b border-gray-100 transition ${!notification.read ? 'bg-blue-50' : ''}`}
                  onClick={() => setIsOpen(false)}
                >
                  <p className="text-sm">{notification.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </Link>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">No notifications</div>
            )}
          </div>
          
          <div className="p-2 border-t border-gray-200 bg-gray-50">
            <Link 
              to="/notifications"
              className="block text-center text-sm text-blue-700 hover:underline"
              onClick={() => setIsOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;