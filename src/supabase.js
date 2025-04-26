import { createClient } from '@supabase/supabase-js';

// These values should be replaced with your actual Supabase credentials
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Authentication helpers
 */

// Sign up a new user
export const signUpUser = async ({ email, password, username }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      }
    }
  });
  
  if (error) throw error;
  
  // If signup is successful, also create a profile record
  if (data.user) {
    await createUserProfile(data.user.id, username);
  }
  
  return data;
};

// Sign in an existing user
export const signInUser = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

// Sign out the current user
export const signOutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Get the current logged-in user
export const getCurrentUser = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) throw error;
  
  if (!session) {
    return null;
  }
  
  // Get the user's profile information
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
    
  return { 
    ...session.user, 
    ...profile 
  };
};

// Create a user profile in the profiles table
const createUserProfile = async (userId, username) => {
  const { error } = await supabase
    .from('profiles')
    .insert([
      { 
        id: userId,
        username,
        created_at: new Date().toISOString(),
      }
    ]);
    
  if (error) throw error;
};

/**
 * Item and service helpers
 */

// Create a new listing (item or service)
export const createListing = async (listingData) => {
  const { data, error } = await supabase
    .from('listings')
    .insert([listingData])
    .select();
    
  if (error) throw error;
  return data[0];
};

// Get a single listing by ID
export const getListingById = async (id) => {
  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      user:user_id (username, created_at),
      event:event_id (id, title, date, location)
    `)
    .eq('id', id)
    .single();
    
  if (error) throw error;
  return data;
};

// Get all listings with optional filters
export const getListings = async ({ 
  contentType, 
  offerType, 
  category, 
  eventId, 
  userId,
  searchTerm,
  limit = 20,
  offset = 0
}) => {
  let query = supabase
    .from('listings')
    .select(`
      *,
      user:user_id (username, created_at),
      event:event_id (id, title, date, location)
    `, { count: 'exact' });
  
  // Apply filters if provided
  if (contentType) query = query.eq('content_type', contentType);
  if (offerType) query = query.eq('offer_type', offerType);
  if (category) query = query.eq('category', category);
  if (eventId) query = query.eq('event_id', eventId);
  if (userId) query = query.eq('user_id', userId);
  
  // Apply search if provided
  if (searchTerm) {
    query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
  }
  
  // Apply pagination
  query = query.range(offset, offset + limit - 1);
  
  // Order by most recent
  query = query.order('created_at', { ascending: false });
  
  const { data, error, count } = await query;
  
  if (error) throw error;
  return { data, count };
};

/**
 * Event helpers
 */

// Create a new event
export const createEvent = async (eventData) => {
  const { data, error } = await supabase
    .from('events')
    .insert([eventData])
    .select();
    
  if (error) throw error;
  return data[0];
};

// Get a single event by ID
export const getEventById = async (id) => {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      organizer:organizer_id (username, created_at)
    `)
    .eq('id', id)
    .single();
    
  if (error) throw error;
  return data;
};

// Get all events with optional filters
export const getEvents = async ({ 
  category, 
  searchTerm, 
  fromDate,
  toDate,
  city,
  limit = 20,
  offset = 0
}) => {
  let query = supabase
    .from('events')
    .select(`
      *,
      organizer:organizer_id (username, created_at)
    `, { count: 'exact' });
  
  // Apply filters if provided
  if (category) query = query.eq('category', category);
  if (city) query = query.eq('city', city);
  
  // Date range filtering
  if (fromDate) query = query.gte('date', fromDate);
  if (toDate) query = query.lte('date', toDate);
  
  // Apply search if provided
  if (searchTerm) {
    query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`);
  }
  
  // Apply pagination
  query = query.range(offset, offset + limit - 1);
  
  // Order by date
  query = query.order('date', { ascending: true });
  
  const { data, error, count } = await query;
  
  if (error) throw error;
  return { data, count };
};

/**
 * Attendance helpers
 */

// RSVP to an event
export const attendEvent = async (userId, eventId) => {
  const { data, error } = await supabase
    .from('attendees')
    .insert([
      {
        user_id: userId,
        event_id: eventId,
        created_at: new Date().toISOString()
      }
    ]);
    
  if (error) throw error;
  return data;
};

// Cancel attendance to an event
export const cancelAttendance = async (userId, eventId) => {
  const { data, error } = await supabase
    .from('attendees')
    .delete()
    .match({
      user_id: userId,
      event_id: eventId
    });
    
  if (error) throw error;
  return data;
};

/**
 * User profile helpers
 */

// Get a user profile by username
export const getUserProfile = async (username) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();
    
  if (error) throw error;
  return data;
};

// Update a user profile
export const updateUserProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select();
    
  if (error) throw error;
  return data[0];
};

export default supabase;