import { useState, useEffect } from 'react';

// utils/AppStorage.js - Centralized storage management with fallbacks

class Storage {
  constructor() {
    this.isLocalStorageAvailable = this.checkLocalStorage();
    this.memoryFallback = new Map();
  }

  checkLocalStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const test = 'localStorage-test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      }
    } catch (e) {
      console.warn('localStorage not available, using memory fallback');
    }
    return false;
  }

  setItem(key, value) {
    try {
      const stringValue = JSON.stringify(value);
      
      if (this.isLocalStorageAvailable) {
        localStorage.setItem(key, stringValue);
      } else {
        this.memoryFallback.set(key, stringValue);
      }
    } catch (error) {
      console.error('Error saving to storage:', error);
      // Fallback to memory if localStorage fails
      this.memoryFallback.set(key, JSON.stringify(value));
    }
  }

  getItem(key) {
    try {
      let value;
      
      if (this.isLocalStorageAvailable) {
        value = localStorage.getItem(key);
      } else {
        value = this.memoryFallback.get(key);
      }
      
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error reading from storage:', error);
      return null;
    }
  }

  removeItem(key) {
    try {
      if (this.isLocalStorageAvailable) {
        localStorage.removeItem(key);
      } else {
        this.memoryFallback.delete(key);
      }
    } catch (error) {
      console.error('Error removing from storage:', error);
    }
  }

  clear() {
    try {
      if (this.isLocalStorageAvailable) {
        localStorage.clear();
      } else {
        this.memoryFallback.clear();
      }
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  // Get storage type for debugging
  getStorageType() {
    return this.isLocalStorageAvailable ? 'localStorage' : 'memory';
  }
}

// Create singleton instance
const storage = new Storage();

// Higher-level API for your app
export const AppStorage = {
  // User posts management
  getUserPosts() {
    return storage.getItem('userPosts') || [];
  },

  addUserPost(post) {
    const posts = this.getUserPosts();
    posts.push(post);
    storage.setItem('userPosts', posts);
    return posts;
  },

  updateUserPost(postId, updates) {
    const posts = this.getUserPosts();
    const index = posts.findIndex(post => post.id === postId);
    if (index !== -1) {
      posts[index] = { ...posts[index], ...updates };
      storage.setItem('userPosts', posts);
    }
    return posts;
  },

  removeUserPost(postId) {
    const posts = this.getUserPosts().filter(post => post.id !== postId);
    storage.setItem('userPosts', posts);
    return posts;
  },

  // ============================================
  // ENHANCED ANONYMOUS IDENTITY MANAGEMENT
  // ============================================
  
  // Anonymous ID management (enhanced)
  getAnonymousId() {
    let anonymousId = storage.getItem('anonymousId');
    if (!anonymousId) {
      anonymousId = `anon-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      this.setAnonymousId(anonymousId);
    }
    return anonymousId;
  },

  setAnonymousId(id) {
    storage.setItem('anonymousId', id);
  },

  // Anonymous user profile management
  getAnonymousProfile() {
    return storage.getItem('anonymousProfile') || {
      anonymousId: this.getAnonymousId(),
      displayName: null,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };
  },

  setAnonymousProfile(profile) {
    const currentProfile = this.getAnonymousProfile();
    const updatedProfile = {
      ...currentProfile,
      ...profile,
      anonymousId: this.getAnonymousId(), // Ensure ID consistency
      lastActive: new Date().toISOString()
    };
    storage.setItem('anonymousProfile', updatedProfile);
    return updatedProfile;
  },

  // Anonymous conversations management
  getAnonymousConversations() {
    return storage.getItem('anonymousConversations') || [];
  },

  addAnonymousConversation(conversation) {
    const conversations = this.getAnonymousConversations();
    const exists = conversations.find(c => c.id === conversation.id);
    if (!exists) {
      conversations.unshift(conversation);
      storage.setItem('anonymousConversations', conversations);
    }
    return conversations;
  },

  updateAnonymousConversation(conversationId, updates) {
    const conversations = this.getAnonymousConversations();
    const index = conversations.findIndex(c => c.id === conversationId);
    if (index !== -1) {
      conversations[index] = { ...conversations[index], ...updates };
      storage.setItem('anonymousConversations', conversations);
    }
    return conversations;
  },

  removeAnonymousConversation(conversationId) {
    const conversations = this.getAnonymousConversations().filter(c => c.id !== conversationId);
    storage.setItem('anonymousConversations', conversations);
    return conversations;
  },

  // Anonymous interests tracking
  getAnonymousInterests() {
    return storage.getItem('anonymousInterests') || [];
  },

  addAnonymousInterest(interest) {
    const interests = this.getAnonymousInterests();
    const exists = interests.find(i => i.postId === interest.postId);
    if (!exists) {
      interests.unshift({
        ...interest,
        timestamp: new Date().toISOString()
      });
      storage.setItem('anonymousInterests', interests);
    }
    return interests;
  },

  // Check if user has expressed interest in a post
  hasExpressedInterest(postId) {
    const interests = this.getAnonymousInterests();
    return interests.some(i => i.postId === postId);
  },

  // ============================================
  // EXISTING METHODS (keep these)
  // ============================================

  // User preferences
  getUserPreferences() {
    return storage.getItem('userPreferences') || {
      theme: 'light',
      notifications: true,
      defaultCategory: '',
      defaultLocation: ''
    };
  },

  setUserPreferences(preferences) {
    storage.setItem('userPreferences', preferences);
  },

  // Draft posts (for when users start creating but don't finish)
  saveDraftPost(draft) {
    storage.setItem('draftPost', draft);
  },

  getDraftPost() {
    return storage.getItem('draftPost');
  },

  clearDraftPost() {
    storage.removeItem('draftPost');
  },

  // Generic storage methods for any data
  setItem(key, value) {
    storage.setItem(key, value);
  },

  getItem(key) {
    return storage.getItem(key);
  },

  removeItem(key) {
    storage.removeItem(key);
  },

  // Debug info
  getStorageInfo() {
    const profile = this.getAnonymousProfile();
    return {
      type: storage.getStorageType(),
      isAvailable: storage.isLocalStorageAvailable,
      userPosts: this.getUserPosts().length,
      anonymousId: this.getAnonymousId(),
      anonymousProfile: profile,
      conversations: this.getAnonymousConversations().length,
      interests: this.getAnonymousInterests().length
    };
  },

  // Cleanup old data (optional maintenance)
  cleanupOldData(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    // Clean old conversations
    const conversations = this.getAnonymousConversations();
    const recentConversations = conversations.filter(c => {
      const lastMessage = new Date(c.lastMessageAt || c.createdAt);
      return lastMessage > cutoffDate;
    });
    storage.setItem('anonymousConversations', recentConversations);
    
    // Clean old interests
    const interests = this.getAnonymousInterests();
    const recentInterests = interests.filter(i => {
      const timestamp = new Date(i.timestamp);
      return timestamp > cutoffDate;
    });
    storage.setItem('anonymousInterests', recentInterests);
    
    console.log(`Cleaned up data older than ${daysOld} days`);
  }
};

// React hook for storage with automatic updates
export const useAppStorage = (key, defaultValue = null) => {
  const [value, setValue] = useState(() => {
    return AppStorage[`get${key}`] ? AppStorage[`get${key}`]() : defaultValue;
  });

  const updateValue = (newValue) => {
    setValue(newValue);
    if (AppStorage[`set${key}`]) {
      AppStorage[`set${key}`](newValue);
    }
  };

  return [value, updateValue];
};

// Custom hook for user posts specifically
export const useUserPosts = () => {
  const [posts, setPosts] = useState(() => AppStorage.getUserPosts());

  const addPost = (post) => {
    const updatedPosts = AppStorage.addUserPost(post);
    setPosts(updatedPosts);
  };

  const updatePost = (postId, updates) => {
    const updatedPosts = AppStorage.updateUserPost(postId, updates);
    setPosts(updatedPosts);
  };

  const removePost = (postId) => {
    const updatedPosts = AppStorage.removeUserPost(postId);
    setPosts(updatedPosts);
  };

  const refreshPosts = () => {
    setPosts(AppStorage.getUserPosts());
  };

  return {
    posts,
    addPost,
    updatePost,
    removePost,
    refreshPosts,
    hasPosts: posts.length > 0
  };
};

// Custom hook for anonymous profile
export const useAnonymousProfile = () => {
  const [profile, setProfile] = useState(() => AppStorage.getAnonymousProfile());

  const updateProfile = (updates) => {
    const updatedProfile = AppStorage.setAnonymousProfile(updates);
    setProfile(updatedProfile);
    return updatedProfile;
  };

  const refreshProfile = () => {
    setProfile(AppStorage.getAnonymousProfile());
  };

  return {
    profile,
    updateProfile,
    refreshProfile,
    anonymousId: profile.anonymousId,
    displayName: profile.displayName,
    hasDisplayName: !!profile.displayName
  };
};

// Custom hook for anonymous conversations
export const useAnonymousConversations = () => {
  const [conversations, setConversations] = useState(() => AppStorage.getAnonymousConversations());

  const addConversation = (conversation) => {
    const updatedConversations = AppStorage.addAnonymousConversation(conversation);
    setConversations(updatedConversations);
  };

  const updateConversation = (conversationId, updates) => {
    const updatedConversations = AppStorage.updateAnonymousConversation(conversationId, updates);
    setConversations(updatedConversations);
  };

  const removeConversation = (conversationId) => {
    const updatedConversations = AppStorage.removeAnonymousConversation(conversationId);
    setConversations(updatedConversations);
  };

  const refreshConversations = () => {
    setConversations(AppStorage.getAnonymousConversations());
  };

  return {
    conversations,
    addConversation,
    updateConversation,
    removeConversation,
    refreshConversations,
    hasConversations: conversations.length > 0
  };
};

export default AppStorage;