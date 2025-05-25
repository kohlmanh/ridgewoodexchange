// utils/storage.js - Centralized storage management with fallbacks

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

  // Anonymous ID management
  getAnonymousId() {
    let anonymousId = storage.getItem('anonymousId');
    if (!anonymousId) {
      anonymousId = `anon-${Math.random().toString(36).substring(2, 15)}`;
      this.setAnonymousId(anonymousId);
    }
    return anonymousId;
  },

  setAnonymousId(id) {
    storage.setItem('anonymousId', id);
  },

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

  // Debug info
  getStorageInfo() {
    return {
      type: storage.getStorageType(),
      isAvailable: storage.isLocalStorageAvailable,
      userPosts: this.getUserPosts().length,
      anonymousId: this.getAnonymousId()
    };
  }
};

// React hook for storage with automatic updates
import { useState, useEffect } from 'react';

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

export default AppStorage;