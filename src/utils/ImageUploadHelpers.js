import { supabase } from '../lib/supabaseClient';

/**
 * Uploads multiple images to Supabase storage and returns an array of public URLs
 * @param {Array} imageObjects - Array of objects containing file properties
 * @returns {Promise<Array>} - Array of objects with image URLs and metadata
 */
export const uploadMultipleImages = async (imageObjects) => {
  if (!imageObjects || imageObjects.length === 0) {
    console.log('No images to upload');
    return [];
  }

  console.log(`Preparing to upload ${imageObjects.length} images:`, imageObjects);
  
  try {
    // Process uploads in parallel using Promise.all
    const uploadPromises = imageObjects.map(async (imageObj, index) => {
      // Skip if this isn't a file object (might be already uploaded)
      if (!imageObj.file) {
        console.log(`Image ${index} has no file property, skipping upload`);
        
        // If it's already an uploaded image with a URL, return it as is
        if (imageObj.url || imageObj.image_url) {
          return {
            url: imageObj.url || imageObj.image_url,
            path: imageObj.path || imageObj.storage_path || '',
            order: imageObj.order || index
          };
        }
        
        return null;
      }
      
      const file = imageObj.file;
      
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      
      console.log(`Uploading image ${index}: ${file.name} as ${fileName}`);
      
      // Upload file to Supabase
      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        console.error(`Error uploading image ${index}:`, error);
        console.log('File information:', { name: file.name, size: file.size, type: file.type });
        return null;
      }
      
      console.log(`Successfully uploaded image ${index}`, data);
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('post-images')
        .getPublicUrl(fileName);
      
      console.log(`Public URL for image ${index}:`, publicUrlData.publicUrl);
      
      return {
        url: publicUrlData.publicUrl,
        path: fileName,
        size: file.size,
        type: file.type,
        order: imageObj.order !== undefined ? imageObj.order : index
      };
    });
    
    // Wait for all uploads to complete
    const results = await Promise.all(uploadPromises);
    
    // Filter out any failed uploads
    const successfulUploads = results.filter(result => result !== null);
    console.log(`Successfully uploaded ${successfulUploads.length} images:`, successfulUploads);
    
    return successfulUploads;
    
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
  if (!postId) {
    console.error('Cannot save images: No post ID provided');
    return false;
  }
  
  if (!imageData || imageData.length === 0) {
    console.log('No images to save to database');
    return false;
  }

  console.log(`Saving ${imageData.length} images for post ${postId}:`, imageData);
  
  try {
    // Prepare image records
    const imageRecords = imageData.map((image, index) => ({
      post_id: postId,
      image_url: image.url,
      storage_path: image.path || '',
      order: image.order !== undefined ? image.order : index,
      created_at: new Date().toISOString()
    }));
    
    console.log('Prepared image records:', imageRecords);
    
    // Insert records into PostImages table
    const { data, error } = await supabase
      .from('PostImages')
      .insert(imageRecords);
    
    if (error) {
      console.error('Error saving post images:', error);
      return false;
    }
    
    console.log('Successfully saved images to database:', data);
    return true;
  } catch (error) {
    console.error('Error in savePostImages:', error);
    return false;
  }
};