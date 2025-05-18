// MultiImageUpload.jsx
import React, { useState, useEffect } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const MultiImageUpload = ({ postId, existingImages = [], onChange }) => {
  const [images, setImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState(null);
  
  // Load existing images when the component mounts or postId changes
  useEffect(() => {
    if (existingImages.length > 0) {
      setImages(existingImages);
    } else if (postId) {
      fetchExistingImages();
    } else {
      setImages([]);
    }
  }, [postId, existingImages]);
  
  // Whenever images change, notify parent component
  useEffect(() => {
    if (onChange) {
      onChange(images);
    }
  }, [images, onChange]);
  
  const fetchExistingImages = async () => {
    try {
      const { data, error } = await supabase
        .from('PostImages')
        .select('*')
        .eq('post_id', postId)
        .order('order', { ascending: true });
        
      if (error) throw error;
      
      setImages(data || []);
    } catch (err) {
      console.error('Error fetching existing images:', err);
      setError('Failed to load existing images. Please try again.');
    }
  };
  
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    
    if (!files.length) return;
    
    setIsUploading(true);
    setError(null);
    
    // Create a copy of images to update
    const updatedImages = [...images];
    
    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError(`File "${file.name}" is not an image. Only image files are allowed.`);
        continue;
      }
      
      // Set up progress tracking for this file
      const uploadId = `upload-${Date.now()}-${i}`;
      setUploadProgress(prev => ({
        ...prev,
        [uploadId]: { progress: 0, fileName: file.name }
      }));
      
      try {
        // Generate a unique file path
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = postId 
          ? `post-images/${postId}/${fileName}`
          : `post-images/temp/${fileName}`;
        
        // Upload the file to Supabase Storage
        const { data, error } = await supabase.storage
          .from('public')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            onUploadProgress: (progress) => {
              const percent = Math.round((progress.loaded / progress.total) * 100);
              setUploadProgress(prev => ({
                ...prev,
                [uploadId]: { ...prev[uploadId], progress: percent }
              }));
            }
          });
          
        if (error) throw error;
        
        // Get the public URL for the file
        const { data: { publicUrl } } = supabase.storage
          .from('public')
          .getPublicUrl(filePath);
          
        // Add the new image to our array
        updatedImages.push({
          id: uploadId, // Temporary ID for new uploads
          image_url: publicUrl,
          order: images.length + i,
          // For new uploads that don't have a post_id yet, 
          // we'll need to update these after the post is created
          post_id: postId || null,
          file_path: filePath, // Store this to help with saving later
          is_new: true // Flag for new uploads
        });
      } catch (err) {
        console.error(`Error uploading file ${file.name}:`, err);
        setError(`Failed to upload "${file.name}". ${err.message || 'Please try again.'}`);
      } finally {
        // Remove this file from progress tracking
        setUploadProgress(prev => {
          const updated = { ...prev };
          delete updated[uploadId];
          return updated;
        });
      }
    }
    
    setImages(updatedImages);
    setIsUploading(false);
    
    // Reset the file input
    e.target.value = '';
  };
  
  const removeImage = async (index) => {
    const imageToRemove = images[index];
    
    // Create a copy of images and remove the image at the specified index
    const updatedImages = [...images];
    updatedImages.splice(index, 1);
    
    // Update order values
    updatedImages.forEach((img, idx) => {
      img.order = idx;
    });
    
    setImages(updatedImages);
    
    // If this is an existing image (not a new upload) and we have a post_id,
    // delete it from the database
    if (postId && imageToRemove.id && !imageToRemove.is_new) {
      try {
        const { error } = await supabase
          .from('PostImages')
          .delete()
          .eq('id', imageToRemove.id);
          
        if (error) throw error;
        
        // Try to delete the file from storage
        if (imageToRemove.file_path) {
          await supabase.storage
            .from('public')
            .remove([imageToRemove.file_path]);
        }
      } catch (err) {
        console.error('Error deleting image:', err);
        // Even if there's an error, we've already removed it from the UI
      }
    }
  };
  
  const reorderImages = (startIndex, endIndex) => {
    const updatedImages = Array.from(images);
    const [removed] = updatedImages.splice(startIndex, 1);
    updatedImages.splice(endIndex, 0, removed);
    
    // Update order values
    updatedImages.forEach((img, idx) => {
      img.order = idx;
    });
    
    setImages(updatedImages);
  };
  
  // Save all images associated with a post
  // This should be called after a post is created or updated
  const saveImagesToPost = async (newPostId) => {
    const postIdToUse = newPostId || postId;
    
    if (!postIdToUse) {
      console.error('Cannot save images without a post ID');
      return { success: false, error: 'Missing post ID' };
    }
    
    try {
      // Handle new images that need to be associated with the post
      const newImages = images.filter(img => img.is_new);
      
      for (const image of newImages) {
        // Insert record in PostImages table
        const { error } = await supabase
          .from('PostImages')
          .insert({
            post_id: postIdToUse,
            image_url: image.image_url,
            order: image.order
          });
          
        if (error) throw error;
      }
      
      // Update order of existing images if needed
      const existingImages = images.filter(img => !img.is_new && img.id);
      
      for (const image of existingImages) {
        const { error } = await supabase
          .from('PostImages')
          .update({ order: image.order })
          .eq('id', image.id);
          
        if (error) throw error;
      }
      
      return { success: true };
    } catch (err) {
      console.error('Error saving images to post:', err);
      return { success: false, error: err.message };
    }
  };
  
  return (
    <div>
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Images
        </label>
        
        {/* Image Preview Grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-2">
            {images.map((image, index) => (
              <div 
                key={image.id || `new-${index}`} 
                className="relative group aspect-square border rounded-md overflow-hidden"
              >
                <img 
                  src={image.image_url} 
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 
                            opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove image"
                >
                  <X size={16} />
                </button>
                
                {index === 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-blue-700 text-white text-xs py-1 text-center">
                    Primary Image
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Upload Progress */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="mt-2 space-y-2">
            {Object.entries(uploadProgress).map(([id, { fileName, progress }]) => (
              <div key={id} className="text-sm">
                <div className="flex justify-between mb-1">
                  <span className="truncate">{fileName}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="text-red-500 text-sm mt-1">
            {error}
          </div>
        )}
        
        {/* Upload Button */}
        <div className="mt-2">
          <label 
            className={`flex items-center justify-center w-full h-24 border-2 border-dashed rounded-md
                      hover:bg-gray-50 cursor-pointer transition-colors
                      ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading}
            />
            
            <div className="text-center">
              {isUploading ? (
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="mt-2 text-sm text-gray-500">Uploading...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload size={24} className="text-gray-400" />
                  <span className="mt-2 text-sm text-gray-500">
                    {images.length > 0 
                      ? 'Add more images' 
                      : 'Click or drag to upload images'}
                  </span>
                </div>
              )}
            </div>
          </label>
        </div>
        
        <p className="text-sm text-gray-500 mt-1">
          You can upload up to 5 images. First image will be the primary image.
        </p>
      </div>
      
      {/* Expose the saveImagesToPost method for parent components */}
      {React.Children.only(
        React.createElement('div', {
          className: 'hidden',
          ref: (el) => {
            if (el && typeof onChange === 'function') {
              el._saveImagesToPost = saveImagesToPost;
            }
          }
        })
      )}
    </div>
  );
};

export default MultiImageUpload;