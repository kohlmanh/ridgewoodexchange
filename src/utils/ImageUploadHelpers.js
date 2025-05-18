import { supabase } from '../lib/supabaseClient';

/**
 * Uploads multiple images to Supabase storage and returns an array of public URLs
 * @param {Array} imageObjects - Array of objects containing file properties
 * @param {string} bucketName - Name of the Supabase storage bucket
 * @returns {Promise<Array>} - Array of objects with image URLs and metadata
 */
export const uploadMultipleImages = async (imageObjects, bucketName = 'post-images') => {
  if (!imageObjects || imageObjects.length === 0) {
    return [];
  }

  try {
    // Process uploads in parallel using Promise.all
    const uploadPromises = imageObjects.map(async (imageObj, index) => {
      const file = imageObj.file;
      if (!file) return null;
      
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      // Upload file to Supabase
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);
      
      if (error) {
        console.error(`Error uploading image ${index}:`, error);
        return null;
      }
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      
      return {
        url: publicUrlData.publicUrl,
        path: filePath,
        size: file.size,
        type: file.type,
        order: index // Keep track of the original order
      };
    });
    
    // Wait for all uploads to complete
    const results = await Promise.all(uploadPromises);
    
    // Filter out any failed uploads
    return results.filter(result => result !== null);
    
  } catch (error) {
    console.error('Error in uploadMultipleImages:', error);
    return [];
  }
};

/**
 * Insert image records into the PostImages table
 * @param {number} postId - ID of the post to associate images with
 * @param {Array} imageData - Array of objects with image URLs and metadata
 * @returns {Promise<boolean>} - Success status
 */
export const savePostImages = async (postId, imageData) => {
  if (!postId || !imageData || imageData.length === 0) {
    return false;
  }

  try {
    // Prepare image records
    const imageRecords = imageData.map((image, index) => ({
      post_id: postId,
      image_url: image.url,
      storage_path: image.path || '',
      order_index: image.order || index,
      created_at: new Date().toISOString()
    }));
    
    // Insert records into PostImages table
    const { data, error } = await supabase
      .from('PostImages')
      .insert(imageRecords);
    
    if (error) {
      console.error('Error saving post images:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in savePostImages:', error);
    return false;
  }
};