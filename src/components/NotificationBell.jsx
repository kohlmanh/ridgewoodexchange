import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Bell } from 'lucide-react';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  
  // Get current user info - either authenticated or anonymous
  const anonymousId = localStorage.getItem('anonymousId');
  
  useEffect(() => {
    // Load initial notifications
    fetchNotifications();
    
    // Setup real-time subscription for new notifications
    const subscription = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Notifications',
          filter: `for_user_id=eq.${anonymousId}`
        },
        (payload) => {
          // Add the new notification to state
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(count => count + 1);
          
          // Optional: Play a sound
          // const sound = new Audio('/notification-sound.mp3');
          // sound.play().catch(e => console.log('Unable to play notification sound', e));
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [anonymousId]);
  
  const fetchNotifications = async () => {
    if (!anonymousId) return;
    
    // For this simple version, we'll just filter by anonymous_id
    const { data, error } = await supabase
      .from('Notifications')
      .select('*')
      .eq('for_user_id', anonymousId)
      .eq('is_for_anonymous', true)
      .order('created_at', { ascending: false })
      .limit(20);
      
    if (error) {
      console.error('Error fetching notifications:', error);
      return;
    }
    
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };
  
  const markAsRead = async (id) => {
    // Mark notification as read
    const { error } = await supabase
      .from('Notifications')
      .update({ is_read: true })
      .eq('id', id);
      
    if (error) {
      console.error('Error marking notification as read:', error);
      return;
    }
    
    // Update local state
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, is_read: true } : n
    ));
    setUnreadCount(count => Math.max(0, count - 1));
  };
  
  const markAllAsRead = async () => {
    // Get all unread notification IDs
    const unreadIds = notifications
      .filter(n => !n.is_read)
      .map(n => n.id);
      
    if (unreadIds.length === 0) return;
    
    // Mark all as read in database
    const { error } = await supabase
      .from('Notifications')
      .update({ is_read: true })
      .in('id', unreadIds);
      
    if (error) {
      console.error('Error marking all notifications as read:', error);
      return;
    }
    
    // Update local state
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };
  
  const toggleNotifications = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button 
        onClick={toggleNotifications}
        className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none"
        aria-label={`${unreadCount} unread notifications`}
      >
        <Bell size={20} />
        
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-10 overflow-hidden">
          <div className="p-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications yet
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    markAsRead(notification.id);
                    // Redirect to post with comment
                    window.location.href = `/post/${notification.post_id}`;
                  }}
                >
                  <div className="font-medium">{notification.title}</div>
                  <div className="text-sm text-gray-800 mt-1">{notification.message}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(notification.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;