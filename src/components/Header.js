import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Mail } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { AppStorage } from '../utils/AppStorage';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkUser();
    fetchUnreadCount();
    
    // Set up real-time subscription for new messages
    const subscription = supabase
      .channel('header-messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'Messages'
        }, 
        () => {
          // When a new message is inserted, refresh unread count
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
  };

  const fetchUnreadCount = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const anonymousId = AppStorage.getAnonymousId();
      
      // Get all conversations for this user
      let conversationsQuery = supabase
        .from('Conversations')
        .select('id');

      if (userData.user?.id) {
        // Authenticated user
        conversationsQuery = conversationsQuery.or(`user1_auth_id.eq.${userData.user.id},user2_auth_id.eq.${userData.user.id}`);
      } else {
        // Anonymous user
        conversationsQuery = conversationsQuery.or(`user1_anonymous_id.eq.${anonymousId},user2_anonymous_id.eq.${anonymousId}`);
      }

      const { data: conversations, error: convError } = await conversationsQuery;
      
      if (convError || !conversations) {
        return;
      }

      if (conversations.length === 0) {
        setUnreadCount(0);
        return;
      }

      // Get unread messages count
      const conversationIds = conversations.map(c => c.id);
      
      let unreadQuery = supabase
        .from('Messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .eq('read_by_recipient', false);

      // Don't count own messages
      if (userData.user?.id) {
        unreadQuery = unreadQuery.not('sender_auth_id', 'eq', userData.user.id);
      } else {
        unreadQuery = unreadQuery.not('sender_anonymous_id', 'eq', anonymousId);
      }

      const { count, error: countError } = await unreadQuery;
      
      if (!countError) {
        setUnreadCount(count || 0);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="border-b border-gray-300">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="text-2xl md:text-4xl font-bold text-blue-700 leading-tight">
            RIDGEWOOD
            <br />
            EXCHANGE
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 text-blue-700 text-sm font-medium">
            <Link to="/" className="hover:underline">HOME</Link>
            <Link to="/about" className="hover:underline">ABOUT</Link>
            <Link to="/post" className="hover:underline">POST</Link>
            <Link to="/communityfeed" className="hover:underline">COMMUNITY FEED</Link>
            
            {/* Messages Icon with Badge - Far Right */}
            <Link to="/messages" className="relative hover:underline flex items-center">
              <Mail size={18} className="mr-1" />
              <span className="hidden sm:inline">MESSAGES</span>
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-blue-700"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 flex flex-col space-y-4 text-blue-700 text-sm font-medium">
            <Link to="/" className="hover:underline" onClick={() => setIsMenuOpen(false)}>HOME</Link>
            <Link to="/about" className="hover:underline" onClick={() => setIsMenuOpen(false)}>ABOUT</Link>
            <Link to="/post" className="hover:underline" onClick={() => setIsMenuOpen(false)}>POST</Link>
            
            {/* Mobile Messages Link */}
            <Link to="/messages" className="hover:underline flex items-center" onClick={() => setIsMenuOpen(false)}>
              <Mail size={16} className="mr-2" />
              MESSAGES
              {unreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
            
            <Link to="/communityfeed" className="hover:underline" onClick={() => setIsMenuOpen(false)}>COMMUNITY FEED</Link>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;