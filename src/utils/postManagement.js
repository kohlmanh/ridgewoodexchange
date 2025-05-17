// src/utils/postManagement.js
import { supabase } from '../lib/supabaseClient';

// Function to get all posts created by the current anonymous user
export const getUserPosts = () => {
  try {
    const userPosts = JSON.parse(localStorage.getItem('userPosts') || '[]');
    return userPosts;
  } catch (error) {
    console.error('Error getting user posts:', error);
    return [];
  }
};

// Function to update an anonymous post
export const updateAnonymousPost = async (postId, anonymousId, updatedData) => {
  try {
    // First, set the anonymous ID as a configuration parameter
    // This lets the RLS policy know which posts the user can edit
    await supabase.rpc('set_config', {
      parameter: 'app.anonymous_id',
      value: anonymousId
    });
    
    // Then perform the update operation
    const { data, error } = await supabase
      .from('Posts')
      .update(updatedData)
      .eq('id', postId)
      .eq('anonymous_id', anonymousId) // Double-check the anonymous ID
      .select();
    
    if (error) throw error;
    
    // Update the post in localStorage
    const userPosts = getUserPosts();
    const updatedUserPosts = userPosts.map(post => {
      if (post.id === postId) {
        return { 
          ...post, 
          title: updatedData.title || post.title,
          // Update any other fields you want to track locally
        };
      }
      return post;
    });
    localStorage.setItem('userPosts', JSON.stringify(updatedUserPosts));
    
    return data;
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
};

// Function to delete an anonymous post
export const deleteAnonymousPost = async (postId, anonymousId) => {
  try {
    // Set the anonymous ID as a configuration parameter
    await supabase.rpc('set_config', {
      parameter: 'app.anonymous_id',
      value: anonymousId
    });
    
    // Perform the delete operation
    const { error } = await supabase
      .from('Posts')
      .delete()
      .eq('id', postId)
      .eq('anonymous_id', anonymousId); // Double-check the anonymous ID
    
    if (error) throw error;
    
    // Remove the post from localStorage
    const userPosts = getUserPosts();
    const updatedUserPosts = userPosts.filter(post => post.id !== postId);
    localStorage.setItem('userPosts', JSON.stringify(updatedUserPosts));
    
    return true;
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};