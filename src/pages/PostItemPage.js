import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Upload, Info, X, Clock, DollarSign, Users } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import MultiImageUpload from '../components/MultiImageUpload';
import { uploadMultipleImages, savePostImages } from '../utils/imageUploadHelpers';

const PostItemPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  // Get listing type from URL query params or default to 'offering'
  const initialOfferType = queryParams.get('type') === 'requesting' ? 'requesting' : 'offering';
  
  // Get initial content type (item vs service)
  const initialContentType = queryParams.get('contentType') === 'service' ? 'service' : 'item';

  const [formData, setFormData] = useState({
    // Listing type (offering or requesting)
    offerType: initialOfferType,
    
    // Content type (item or service)
    contentType: initialContentType,
    
    // Common fields for both items and services
    title: '',
    description: '',
    contactMethod: 'email',
    contactInfo: '',
    eventId: '',
    anonymous: true,
    
    // Item-specific fields
    itemCategory: '',
    condition: 'Good',
    // Replace single imageFile with array of image objects
    images: [],
    lookingFor: '',  // What the offerer wants in exchange
    canOffer: '',    // What the requester can offer in exchange
    
    // Service-specific fields
    serviceCategory: '',
    experienceLevel: 'Intermediate',
    availability: '',
    rateType: 'trade',  // trade, hourly, fixed
    rateAmount: '',
    rateNotes: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Empty events array - will be populated from database in a real implementation
  const events = [];

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

  const handleContactMethodChange = (method) => {
    // Clear the contactInfo field when switching contact methods
    setFormData(prev => ({
      ...prev,
      contactMethod: method,
      contactInfo: '' // Reset the contact info when changing methods
    }));

    // Clear any errors for the contactInfo field
    if (errors.contactInfo) {
      setErrors(prev => ({ ...prev, contactInfo: '' }));
    }
  };

  // Handle image changes (now using the MultiImageUpload component)
  const handleImagesChange = (newImages) => {
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
  };

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

  // Modified for handling multiple images
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validate()) {
      setIsSubmitting(true);
      
      try {
        // Use existing anonymousId from localStorage or generate a new one
        const anonymousId = localStorage.getItem('anonymousId') || 
          Math.random().toString(36).substring(2, 15);

        // Store it in localStorage for future use
        localStorage.setItem('anonymousId', anonymousId);
        
        // Prepare data for database submission - without images
        const submissionData = {
          // Use anonymous ID instead of user_id for anonymous posts
          anonymous_id: anonymousId,
          
          // Common fields
          offer_type: formData.offerType,
          content_type: formData.contentType,
          title: formData.title,
          description: formData.description,
          contact_method: formData.contactMethod,
          contact_info: formData.contactInfo,
          event_id: formData.eventId || null,
          is_anonymous: formData.anonymous,
          created_at: new Date().toISOString(),
          likes: 0,
          comments: 0,
          
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
        
        // For item offerings, set first image as the main image for display in post lists
        // We'll store all images in the PostImages table
        if (formData.contentType === 'item' && formData.offerType === 'offering' && formData.images.length > 0) {
          // Upload all images and get their URLs
          const uploadedImages = await uploadMultipleImages(formData.images);
          
          // Set the first image as the main image for the post
          if (uploadedImages.length > 0) {
            submissionData.image_url = uploadedImages[0].url;
          }
        }
        
        console.log("Submitting post with data:", submissionData);
        
        // Insert data into Supabase
        const { data, error } = await supabase
          .from('Posts')
          .insert(submissionData)
          .select();
        
        if (error) {
          throw error;
        }
        
        const postId = data[0].id;
        
        // If we have multiple images, save them to the PostImages table
        if (formData.contentType === 'item' && formData.offerType === 'offering' && formData.images.length > 0) {
          // Upload all images and get their URLs
          const uploadedImages = await uploadMultipleImages(formData.images);
          
          // Save the images to the PostImages table
          await savePostImages(postId, uploadedImages);
        }
        
        // Save the anonymousId to localStorage for post management
        // This allows users to manage their posts without signing in
        let userPosts = JSON.parse(localStorage.getItem('userPosts') || '[]');
        userPosts.push({
          id: postId,
          anonymousId: anonymousId,
          title: formData.title,
          date: new Date().toISOString()
        });
        localStorage.setItem('userPosts', JSON.stringify(userPosts));
        
        alert('Your listing has been posted successfully!');
        navigate('/');
      } catch (error) {
        console.error('Error submitting form:', error);
        alert('There was an error posting your listing. Please try again.');
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-4xl font-bold mb-12 text-center" style={{ color: colors.primary }}>
        Create Post
      </h1>

      <form onSubmit={handleSubmit}>
        {/* Content Type and Offer Type Selection - Horizontal Layout */}
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Side - What are you posting */}
            <div>
              <h2 className="text-2xl mb-6 font-semibold" style={{ color: colors.primary }}>
                What are you posting?
              </h2>
              
              <div className="grid grid-cols-2 gap-0 rounded-lg overflow-hidden shadow-sm">
                <button
                  type="button"
                  className="py-4 px-4 font-medium transition-colors"
                  style={{ 
                    backgroundColor: formData.contentType === 'item' ? '#343a40' : colors.lightGray,
                    color: formData.contentType === 'item' ? colors.white : colors.textSecondary
                  }}
                  onClick={() => setFormData(prev => ({ ...prev, contentType: 'item' }))}
                >
                  Physical Item
                </button>
                <button
                  type="button"
                  className="py-4 px-4 font-medium transition-colors"
                  style={{ 
                    backgroundColor: formData.contentType === 'service' ? colors.lightGray : colors.lightGray,
                    color: formData.contentType === 'service' ? colors.textPrimary : colors.textSecondary
                  }}
                  onClick={() => setFormData(prev => ({ ...prev, contentType: 'service' }))}
                >
                  Service
                </button>
              </div>
            </div>
            
            {/* Right Side - Offering vs Requesting */}
            <div>
              <h2 className="text-2xl mb-6 font-semibold opacity-0">
                .
              </h2>
              
              <div className="grid grid-cols-2 gap-0 rounded-lg overflow-hidden shadow-sm">
                <button
                  type="button"
                  className="py-4 px-4 font-medium transition-colors"
                  style={{ 
                    backgroundColor: formData.offerType === 'offering' ? colors.primary : colors.lightGray,
                    color: formData.offerType === 'offering' ? colors.white : colors.textSecondary
                  }}
                  onClick={() => setFormData(prev => ({ ...prev, offerType: 'offering' }))}
                >
                  I'm Offering
                </button>
                <button
                  type="button"
                  className="py-4 px-4 font-medium transition-colors"
                  style={{ 
                    backgroundColor: formData.offerType === 'requesting' ? colors.lightGray : colors.lightGray,
                    color: formData.offerType === 'requesting' ? colors.textPrimary : colors.textSecondary
                  }}
                  onClick={() => setFormData(prev => ({ ...prev, offerType: 'requesting' }))}
                >
                  I'm Requesting
                </button>
              </div>
            </div>
          </div>
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
                    placeholder="Describe what you'd like in exchange for this item (optional). Examples: kitchen tools, garden seeds, help with a project, etc."
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
                  placeholder="Describe what you can offer in exchange for this item (optional). Examples: other items you have, skills, time, help with projects, etc."
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
                placeholder={
                  formData.contentType === 'item'
                    ? (formData.offerType === 'offering' 
                      ? "Describe your item. Include details like dimensions, brand, age, etc." 
                      : "Describe what you're looking for with as much detail as possible."
                    )
                    : (formData.offerType === 'offering'
                      ? "Describe the service you can provide. Include details about your experience, approach, etc."
                      : "Describe the service you're looking for with as much detail as possible."
                    )
                }
              ></textarea>
              {errors.description && <p className="mt-1 text-red-500 text-sm">{errors.description}</p>}
            </div>

            {/* Multi-Image Upload (only for offering items) - REPLACED SINGLE IMAGE UPLOAD WITH MULTI-IMAGE */}
            {formData.contentType === 'item' && formData.offerType === 'offering' && (
              <div className="mb-6">
                <label className="block mb-2 text-xl font-semibold" style={{ color: colors.primary }}>
                  Add Images (optional)
                </label>
                
                {/* Use the new MultiImageUpload component */}
                <MultiImageUpload 
                  images={formData.images}
                  setImages={(newImages) => setFormData(prev => ({ ...prev, images: newImages }))}
                  maxImages={5}
                />
                
                <p className="text-gray-500 text-sm mt-1 flex items-start">
                  <Info size={14} className="inline mr-1 mt-1 flex-shrink-0" />
                  <span>Add up to 5 images to showcase your item. First image will be the main image.</span>
                </p>
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

            {/* Contact Method Selection */}
            <div className="mb-6">
              <label className="block mb-2 text-xl font-semibold" style={{ color: colors.primary }}>
                Preferred Contact Method <span className="text-blue-600">*</span>
              </label>
              
              <div className="grid grid-cols-3 gap-2 mb-3">
                <button
                  type="button"
                  className={`py-3 px-4 font-medium rounded-lg transition-colors ${
                    formData.contactMethod === 'email' 
                      ? 'bg-blue-100 text-blue-800 border-blue-200 border-2' 
                      : 'bg-gray-100 text-gray-700 border-transparent border-2 hover:bg-gray-200'
                  }`}
                  onClick={() => handleContactMethodChange('email')}
                >
                  Email
                </button>
                <button
                  type="button"
                  className={`py-3 px-4 font-medium rounded-lg transition-colors ${
                    formData.contactMethod === 'phone' 
                      ? 'bg-blue-100 text-blue-800 border-blue-200 border-2' 
                      : 'bg-gray-100 text-gray-700 border-transparent border-2 hover:bg-gray-200'
                  }`}
                  onClick={() => handleContactMethodChange('phone')}
                >
                  Phone
                </button>
                <button
                  type="button"
                  className={`py-3 px-4 font-medium rounded-lg transition-colors ${
                    formData.contactMethod === 'chat' 
                      ? 'bg-blue-100 text-blue-800 border-blue-200 border-2' 
                      : 'bg-gray-100 text-gray-700 border-transparent border-2 hover:bg-gray-200'
                  }`}
                  onClick={() => handleContactMethodChange('chat')}
                >
                  In-App Chat
                </button>
              </div>
              
              <div>
                <label htmlFor="contactInfo" className="block mb-2 text-sm font-medium text-gray-700">
                  {formData.contactMethod === 'email' 
                    ? 'Your Email Address' 
                    : formData.contactMethod === 'phone' 
                      ? 'Your Phone Number' 
                      : 'Username or Preferred Name'
                  }
                  <span className="text-blue-600"> *</span>
                </label>
                <input
                  type={formData.contactMethod === 'email' ? 'email' : 'text'}
                  id="contactInfo"
                  name="contactInfo"
                  value={formData.contactInfo}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                    errors.contactInfo ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
                  } focus:outline-none`}
                  placeholder={
                    formData.contactMethod === 'email' 
                      ? 'your@email.com' 
                      : formData.contactMethod === 'phone' 
                        ? '(555) 123-4567' 
                        : 'Enter your preferred contact name'
                  }
                />
                {errors.contactInfo && <p className="mt-1 text-red-500 text-sm">{errors.contactInfo}</p>}
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                  isSubmitting 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? 'Posting...' : 'Post Listing'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PostItemPage;