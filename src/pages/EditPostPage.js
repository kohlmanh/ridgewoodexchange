import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Upload, Info, X, Clock, DollarSign, Users } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { updateAnonymousPost } from '../utils/postManagement';

const EditPostPage = () => {
  const navigate = useNavigate();
  const { postId } = useParams();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [originalPost, setOriginalPost] = useState(null);
  
  // Item categories
  const itemCategories = [
    'Books & Media', 'Clothing', 'Electronics', 'Furniture', 
    'Garden', 'Home Goods', 'Kids & Toys', 'Music', 'Outdoors', 
    'Pet Supplies', 'Sports', 'Tools', 'Other'
  ];

  // Service categories
  const serviceCategories = [
    'Education & Tutoring', 'Home Repair', 'Computer & Tech Support',
    'Creative & Design', 'Health & Wellness', 'Events & Entertainment',
    'Professional Services', 'Crafts & Handmade', 'Transportation',
    'Cleaning & Organization', 'Pet Care', 'Yard & Garden Work', 'Other'
  ];
  
  // Initialize form data with default values (will be replaced with post data)
  const [formData, setFormData] = useState({
    // Will be populated later when we load the post
    title: '',
    description: '',
    contactMethod: 'email',
    contactInfo: '',
    offerType: 'offering',
    contentType: 'item',
    itemCategory: '',
    serviceCategory: '',
    condition: 'Good',
    imageFile: null,
    imagePreview: null,
    lookingFor: '',
    canOffer: '',
    experienceLevel: 'Intermediate',
    availability: '',
    rateType: 'trade',
    rateAmount: '',
    rateNotes: '',
    anonymous: true,
    eventId: ''
  });

  // Load the post data on component mount
  useEffect(() => {
    const loadPost = async () => {
      try {
        setLoading(true);
        
        // First, try to get info from localStorage (including the anonymousId)
        const storedEditPost = JSON.parse(localStorage.getItem('editPost') || 'null');
        
        if (!storedEditPost || !storedEditPost.id || !storedEditPost.anonymousId) {
          throw new Error("Post information is missing. Unable to edit this post.");
        }
        
        // Fetch the current post data from Supabase
        const { data: post, error } = await supabase
          .from('Posts')
          .select('*')
          .eq('id', postId)
          .single();
        
        if (error) throw error;
        if (!post) throw new Error("Post not found.");
        
        // Verify this is the user's post by matching the anonymous ID
        if (post.anonymous_id !== storedEditPost.anonymousId) {
          throw new Error("You don't have permission to edit this post.");
        }
        
        // Store the original post data and anonymousId
        setOriginalPost({
          ...post,
          anonymousId: storedEditPost.anonymousId
        });
        
        // Transform the database fields to match our form structure
        setFormData({
          title: post.title || '',
          description: post.description || '',
          contactMethod: post.contact_method || 'email',
          contactInfo: post.contact_info || '',
          offerType: post.offer_type || 'offering',
          contentType: post.content_type || 'item',
          itemCategory: post.content_type === 'item' ? post.category : '',
          serviceCategory: post.content_type === 'service' ? post.category : '',
          condition: post.condition || 'Good',
          imagePreview: post.image_url || null,
          imageFile: null, // Can't load the file itself, only the URL
          lookingFor: post.looking_for || '',
          canOffer: post.can_offer || '',
          experienceLevel: post.experience_level || 'Intermediate',
          availability: post.availability || '',
          rateType: post.rate_type || 'trade',
          rateAmount: post.rate_amount || '',
          rateNotes: post.rate_notes || '',
          anonymous: post.is_anonymous,
          eventId: post.event_id || ''
        });
      } catch (error) {
        console.error('Error loading post:', error);
        alert(error.message || 'Error loading post for editing. Please try again.');
        navigate('/my-posts');
      } finally {
        setLoading(false);
      }
    };
    
    loadPost();
  }, [postId, navigate]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear the error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle image changes
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Create a preview URL for the selected image
    const previewUrl = URL.createObjectURL(file);
    
    setFormData(prev => ({
      ...prev,
      imageFile: file,
      imagePreview: previewUrl
    }));
  };

  // Remove selected image
  const removeImage = () => {
    // Revoke the URL to prevent memory leaks
    if (formData.imagePreview && !formData.imagePreview.startsWith('http')) {
      URL.revokeObjectURL(formData.imagePreview);
    }
    
    setFormData(prev => ({
      ...prev,
      imageFile: null,
      imagePreview: null
    }));
  };

  // Validate form fields
  const validate = () => {
    const newErrors = {};
    
    // Common validations
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.contactInfo.trim()) newErrors.contactInfo = 'Contact information is required';
    
    // Item-specific validations
    if (formData.contentType === 'item') {
      if (!formData.itemCategory) newErrors.itemCategory = 'Please select a category';
      if (formData.offerType === 'offering' && !formData.condition) {
        newErrors.condition = 'Please select a condition';
      }
    }
    
    // Service-specific validations
    if (formData.contentType === 'service') {
      if (!formData.serviceCategory) newErrors.serviceCategory = 'Please select a service category';
      if (!formData.availability.trim()) newErrors.availability = 'Availability is required';
      if (formData.rateType !== 'trade' && !formData.rateAmount.trim()) {
        newErrors.rateAmount = 'Please specify a rate amount';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Upload image to Supabase Storage
  const uploadImage = async (file) => {
    if (!file) return null;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${fileName}`;
    
    try {
      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(filePath, file);
      
      if (error) {
        throw error;
      }
      
      // Get public URL for the uploaded image
      const { data: publicUrlData } = supabase.storage
        .from('post-images')
        .getPublicUrl(filePath);
    
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image: ', error);
      return null;
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!originalPost || !originalPost.anonymousId) {
      alert('Post information is missing. Unable to update this post.');
      return;
    }
    
    if (validate()) {
      setIsSubmitting(true);
      
      try {
        // Upload image if a new one is selected
        let imageUrl = formData.imagePreview;
        if (formData.imageFile) {
          const newImageUrl = await uploadImage(formData.imageFile);
          if (newImageUrl) {
            imageUrl = newImageUrl;
          }
        }
        
        // Prepare data for database submission
        const updatedData = {
          title: formData.title,
          description: formData.description,
          contact_method: formData.contactMethod,
          contact_info: formData.contactInfo,
          event_id: formData.eventId || null,
          is_anonymous: formData.anonymous,
          image_url: imageUrl,
          
          // Additional fields based on content type
          ...(formData.contentType === 'item' ? {
            category: formData.itemCategory,
            condition: formData.offerType === 'offering' ? formData.condition : null,
            looking_for: formData.offerType === 'offering' ? formData.lookingFor : null,
            can_offer: formData.offerType === 'requesting' ? formData.canOffer : null,
          } : {
            category: formData.serviceCategory,
            experience_level: formData.experienceLevel,
            availability: formData.availability,
            rate_type: formData.rateType,
            rate_amount: formData.rateType !== 'trade' ? formData.rateAmount : null,
            rate_notes: formData.rateNotes
          })
        };
        
        // Update the post using the anonymous ID
        await updateAnonymousPost(originalPost.id, originalPost.anonymousId, updatedData);
        
        alert('Your listing has been updated successfully!');
        navigate('/my-posts');
      } catch (error) {
        console.error('Error updating post:', error);
        alert('There was an error updating your listing. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Scroll to the first error
      const firstErrorField = Object.keys(errors)[0];
      document.querySelector(`[name="${firstErrorField}"]`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  // Define theme colors for our clean, modern, minimalist design
  const colors = {
    primary: '#0052cc', // Main blue (deeper blue based on screenshot)
    primaryLight: '#e6f0ff',
    primaryDark: '#003d99',
    accent: '#4d94ff', 
    white: '#ffffff',
    lightGray: '#f5f7fa',
    mediumGray: '#e1e5eb',
    darkGray: '#4a5568',
    textPrimary: '#2d3748',
    textSecondary: '#718096',
    error: '#e53e3e',
    success: '#38a169',
    requesting: '#9254de', // Purple for requesting
    service: '#1890ff' // Blue for services
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 flex justify-center">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-8">
        <Link to="/my-posts" className="flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-4">
          <ArrowLeft size={16} className="mr-2" />
          Back to My Posts
        </Link>
        <h1 className="text-4xl font-bold text-center" style={{ color: colors.primary }}>
          Edit Post
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Display post type (not editable) */}
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Side - What are you posting */}
            <div>
              <h2 className="text-2xl mb-6 font-semibold" style={{ color: colors.primary }}>
                Post Type
              </h2>
              
              <div className="grid grid-cols-2 gap-0 rounded-lg overflow-hidden shadow-sm">
                <div
                  className="py-4 px-4 font-medium"
                  style={{ 
                    backgroundColor: formData.contentType === 'item' ? '#343a40' : colors.lightGray,
                    color: formData.contentType === 'item' ? colors.white : colors.textSecondary,
                    opacity: 0.8
                  }}
                >
                  Physical Item
                </div>
                <div
                  className="py-4 px-4 font-medium"
                  style={{ 
                    backgroundColor: formData.contentType === 'service' ? colors.lightGray : colors.lightGray,
                    color: formData.contentType === 'service' ? colors.textPrimary : colors.textSecondary,
                    opacity: 0.8
                  }}
                >
                  Service
                </div>
              </div>
            </div>
            
            {/* Right Side - Offering vs Requesting */}
            <div>
              <h2 className="text-2xl mb-6 font-semibold opacity-0">
                .
              </h2>
              
              <div className="grid grid-cols-2 gap-0 rounded-lg overflow-hidden shadow-sm">
                <div
                  className="py-4 px-4 font-medium"
                  style={{ 
                    backgroundColor: formData.offerType === 'offering' ? colors.primary : colors.lightGray,
                    color: formData.offerType === 'offering' ? colors.white : colors.textSecondary,
                    opacity: 0.8
                  }}
                >
                  I'm Offering
                </div>
                <div
                  className="py-4 px-4 font-medium"
                  style={{ 
                    backgroundColor: formData.offerType === 'requesting' ? colors.lightGray : colors.lightGray,
                    color: formData.offerType === 'requesting' ? colors.textPrimary : colors.textSecondary,
                    opacity: 0.8
                  }}
                >
                  I'm Requesting
                </div>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            <Info size={14} className="inline mr-1" />
            Post type cannot be changed. If you want to change the type, please create a new post.
          </p>
        </div>
      
        {/* Main form content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div>
            {/* Title */}
            <div className="mb-6">
              <label htmlFor="title" className="block mb-2 text-xl font-semibold" style={{ color: colors.primary }}>
                Title <span className="text-blue-600">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                  errors.title ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
                } focus:outline-none`}
                placeholder={
                  formData.contentType === 'item'
                    ? formData.offerType === 'offering' ? "What item are you offering?" : "What item are you requesting?"
                    : formData.offerType === 'offering' ? "What service are you offering?" : "What service are you requesting?"
                }
              />
              {errors.title && <p className="mt-1 text-red-500 text-sm">{errors.title}</p>}
            </div>

            {/* Category - Different based on content type */}
            {formData.contentType === 'item' ? (
              <div className="mb-6">
                <label htmlFor="itemCategory" className="block mb-2 text-xl font-semibold" style={{ color: colors.primary }}>
                  Item Category <span className="text-blue-600">*</span>
                </label>
                <div className="relative">
                  <select
                    id="itemCategory"
                    name="itemCategory"
                    value={formData.itemCategory}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg appearance-none bg-white ${
                      errors.itemCategory ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
                    } focus:outline-none`}
                  >
                    <option value="">Select a category</option>
                    {itemCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
                {errors.itemCategory && <p className="mt-1 text-red-500 text-sm">{errors.itemCategory}</p>}
              </div>
            ) : (
              <div className="mb-6">
                <label htmlFor="serviceCategory" className="block mb-2 text-xl font-semibold" style={{ color: colors.primary }}>
                  Service Category <span className="text-blue-600">*</span>
                </label>
                <div className="relative">
                  <select
                    id="serviceCategory"
                    name="serviceCategory"
                    value={formData.serviceCategory}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg appearance-none bg-white ${
                      errors.serviceCategory ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
                    } focus:outline-none`}
                  >
                    <option value="">Select a category</option>
                    {serviceCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
                {errors.serviceCategory && <p className="mt-1 text-red-500 text-sm">{errors.serviceCategory}</p>}
              </div>
            )}

            {/* Condition (only for items being offered) */}
            {formData.contentType === 'item' && formData.offerType === 'offering' && (
              <>
                <div className="mb-6">
                  <label htmlFor="condition" className="block mb-2 text-xl font-semibold" style={{ color: colors.primary }}>
                    Condition <span className="text-blue-600">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="condition"
                      name="condition"
                      value={formData.condition}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg appearance-none bg-white ${
                        errors.condition ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
                      } focus:outline-none`}
                    >
                      <option value="">Select condition</option>
                      <option value="New">New</option>
                      <option value="Like New">Like New</option>
                      <option value="Excellent">Excellent</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Poor">Poor</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>
                  {errors.condition && <p className="mt-1 text-red-500 text-sm">{errors.condition}</p>}
                </div>
                
                {/* Looking for in exchange field for offering items */}
                <div className="mb-6">
                  <label htmlFor="lookingFor" className="block mb-2 text-xl font-semibold" style={{ color: colors.primary }}>
                    Looking For In Exchange
                  </label>
                  <textarea
                    id="lookingFor"
                    name="lookingFor"
                    value={formData.lookingFor || ''}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="Describe what you'd like in exchange for this item (optional)."
                  ></textarea>
                </div>
              </>
            )}
            
            {/* What I can offer field for requesting items */}
            {formData.contentType === 'item' && formData.offerType === 'requesting' && (
              <div className="mb-6">
                <label htmlFor="canOffer" className="block mb-2 text-xl font-semibold" style={{ color: colors.primary }}>
                  What I Can Offer In Return
                </label>
                <textarea
                  id="canOffer"
                  name="canOffer"
                  value={formData.canOffer || ''}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="Describe what you can offer in exchange for this item (optional)."
                ></textarea>
              </div>
            )}

            {/* Service-specific fields */}
            {formData.contentType === 'service' && (
              <div className="space-y-6">
                {/* Experience Level (only for offering services) */}
                {formData.offerType === 'offering' && (
                  <div>
                    <label htmlFor="experienceLevel" className="block mb-2 text-xl font-semibold" style={{ color: colors.primary }}>
                      Experience Level
                    </label>
                    <div className="relative">
                      <select
                        id="experienceLevel"
                        name="experienceLevel"
                        value={formData.experienceLevel}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg appearance-none bg-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Expert">Expert</option>
                        <option value="Professional">Professional</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                )}

                {/* Availability */}
                <div>
                  <label htmlFor="availability" className="block mb-2 text-xl font-semibold" style={{ color: colors.primary }}>
                    <Clock size={20} className="inline mr-2" />
                    Availability <span className="text-blue-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="availability"
                    name="availability"
                    value={formData.availability}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                      errors.availability ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
                    } focus:outline-none`}
                    placeholder="e.g., Weekends, Evenings, Flexible, etc."
                  />
                  {errors.availability && <p className="mt-1 text-red-500 text-sm">{errors.availability}</p>}
                </div>

                {/* Rate Type and Amount */}
                <div>
                  <label className="block mb-2 text-xl font-semibold" style={{ color: colors.primary }}>
                    <DollarSign size={20} className="inline mr-2" />
                    Exchange Preference
                  </label>
                  
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <button
                      type="button"
                      className="py-3 px-2 font-medium rounded-lg transition-colors"
                      style={{ 
                        backgroundColor: formData.rateType === 'trade' ? colors.primaryLight : colors.lightGray,
                        color: formData.rateType === 'trade' ? colors.primaryDark : colors.textSecondary
                      }}
                      onClick={() => setFormData(prev => ({ ...prev, rateType: 'trade' }))}
                    >
                      Trade/Barter
                    </button>
                    <button
                      type="button"
                      className="py-3 px-2 font-medium rounded-lg transition-colors"
                      style={{ 
                        backgroundColor: formData.rateType === 'hourly' ? colors.primaryLight : colors.lightGray,
                        color: formData.rateType === 'hourly' ? colors.primaryDark : colors.textSecondary
                      }}
                      onClick={() => setFormData(prev => ({ ...prev, rateType: 'hourly' }))}
                    >
                      Time Exchange
                    </button>
                    <button
                      type="button"
                      className="py-3 px-2 font-medium rounded-lg transition-colors"
                      style={{ 
                        backgroundColor: formData.rateType === 'fixed' ? colors.primaryLight : colors.lightGray,
                        color: formData.rateType === 'fixed' ? colors.primaryDark : colors.textSecondary
                      }}
                      onClick={() => setFormData(prev => ({ ...prev, rateType: 'fixed' }))}
                    >
                      Volunteer
                    </button>
                  </div>
                  
                  {formData.rateType !== 'trade' && (
                    <div className="mb-3">
                      <input
                        type="text"
                        id="rateAmount"
                        name="rateAmount"
                        value={formData.rateAmount}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                          errors.rateAmount ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
                        } focus:outline-none`}
                        placeholder={formData.rateType === 'hourly' ? "Estimated hours (e.g., 2 hours)" : "What you're offering in return"}
                      />
                      {errors.rateAmount && <p className="mt-1 text-red-500 text-sm">{errors.rateAmount}</p>}
                    </div>
                  )}
                  
                  <div>
                    <label htmlFor="rateNotes" className="block mb-1 text-sm text-gray-700">Additional notes about exchange</label>
                    <textarea
                      id="rateNotes"
                      name="rateNotes"
                      value={formData.rateNotes}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="Optional details about what you're willing to exchange"
                    ></textarea>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div>
            {/* Description */}
            <div className="mb-6">
              <label htmlFor="description" className="block mb-2 text-xl font-semibold" style={{ color: colors.primary }}>
                Description <span className="text-blue-600">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                  errors.description ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
                } focus:outline-none`}
                placeholder="Provide a detailed description of your item or service."
              ></textarea>
              {errors.description && <p className="mt-1 text-red-500 text-sm">{errors.description}</p>}
            </div>

            {/* Image Upload (only for offering items) */}
            {formData.contentType === 'item' && formData.offerType === 'offering' && (
              <div className="mb-6">
                <label className="block mb-2 text-xl font-semibold" style={{ color: colors.primary }}>
                  Images
                </label>
                
                {formData.imagePreview ? (
                  <div className="mb-3">
                    <div className="relative w-full h-48 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                      <img 
                        src={formData.imagePreview} 
                        alt="Preview" 
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        className="absolute top-2 right-2 bg-white border border-gray-200 text-gray-600 p-2 rounded-full shadow-sm hover:bg-gray-100 transition-colors"
                        onClick={removeImage}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-blue-300 hover:bg-blue-50"
                    onClick={() => document.getElementById('image-upload').click()}
                  >
                    <Upload size={32} className="mx-auto text-blue-400 mb-3" />
                    <p className="text-gray-600 mb-1">Click to upload an image</p>
                    <p className="text-gray-400 text-sm">PNG, JPG, or GIF up to 5MB</p>
                  </div>
                )}
                
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            )}

            {/* Associated Event (optional) */}
            <div className="mb-6">
              <label htmlFor="eventId" className="block mb-2 text-xl font-semibold" style={{ color: colors.primary }}>
                <Users size={20} className="inline mr-2" />
                Associate with an Event (optional)
              </label>
              <div className="relative">
                <select
                  id="eventId"
                  name="eventId"
                  value={formData.eventId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg appearance-none bg-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Post independently</option>
                  <option value="upcoming">Upcoming Exchange Event</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
              <p className="text-gray-500 text-sm mt-1 flex items-start">
                <Info size={14} className="inline mr-1 mt-1 flex-shrink-0" />
                <span>Items and services associated with events will be shown to attendees</span>
              </p>
            </div>

            {/* Contact Information */}
            <div className="mb-6">
              <label className="block mb-2 text-xl font-semibold" style={{ color: colors.primary }}>
                Contact Preference <span className="text-blue-600">*</span>
              </label>
              
              <div className="flex space-x-2 mb-3">
                <button
                  type="button"
                  className="flex-1 py-3 font-medium rounded-lg transition-colors"
                  style={{ 
                    backgroundColor: formData.contactMethod === 'email' ? colors.primaryLight : colors.lightGray,
                    color: formData.contactMethod === 'email' ? colors.primaryDark : colors.textSecondary
                  }}
                  onClick={() => setFormData(prev => ({ ...prev, contactMethod: 'email' }))}
                >
                  Email
                </button>
                <button
                  type="button"
                  className="flex-1 py-3 font-medium rounded-lg transition-colors"
                  style={{ 
                    backgroundColor: formData.contactMethod === 'phone' ? colors.primaryLight : colors.lightGray,
                    color: formData.contactMethod === 'phone' ? colors.primaryDark : colors.textSecondary
                  }}
                  onClick={() => setFormData(prev => ({ ...prev, contactMethod: 'phone' }))}
                >
                  Phone
                </button>
                <button
                  type="button"
                  className="flex-1 py-3 font-medium rounded-lg transition-colors"
                  style={{ 
                    backgroundColor: formData.contactMethod === 'both' ? colors.primaryLight : colors.lightGray,
                    color: formData.contactMethod === 'both' ? colors.primaryDark : colors.textSecondary
                  }}
                  onClick={() => setFormData(prev => ({ ...prev, contactMethod: 'both' }))}
                >
                  Both
                </button>
              </div>
              
              <input
                type="text"
                id="contactInfo"
                name="contactInfo"
                value={formData.contactInfo}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                  errors.contactInfo ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
                } focus:outline-none`}
                placeholder={
                  formData.contactMethod === 'email' ? "Your email address" :
                  formData.contactMethod === 'phone' ? "Your phone number" :
                  "Your email and/or phone number"
                }
              />
              {errors.contactInfo && <p className="mt-1 text-red-500 text-sm">{errors.contactInfo}</p>}
            </div>

            {/* Anonymous Posting */}
            <div className="mb-8">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="anonymous"
                  name="anonymous"
                  checked={formData.anonymous}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="anonymous" className="ml-2 text-gray-700 font-medium">Post anonymously</label>
              </div>
              <p className="text-gray-500 text-sm mt-1 ml-7">
                Your contact info will only be shared with interested parties
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex justify-center">
          <button
            type="submit" 
            className="px-12 py-4 rounded-lg font-medium text-lg transition-colors shadow-sm focus:outline-none"
            style={{ 
              backgroundColor: colors.primary,
              color: colors.white
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin h-5 w-5 mr-2 border-b-2 border-white rounded-full"></div>
                Updating...
              </div>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditPostPage;