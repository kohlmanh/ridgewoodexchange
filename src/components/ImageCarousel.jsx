// ImageCarousel.jsx
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ImageCarousel = ({ images, alt = 'Image' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Make sure we have an array of images
  const imageArray = Array.isArray(images) ? images : [images].filter(Boolean);
  
  // Reset the index when images change
  useEffect(() => {
    setCurrentIndex(0);
  }, [images]);
  
  // If no images provided, show placeholder
  if (!imageArray.length) {
    return (
      <div className="aspect-square w-full bg-gray-200 flex items-center justify-center rounded-lg">
        <span className="text-gray-400">No image available</span>
      </div>
    );
  }
  
  // If only one image, show it without controls
  if (imageArray.length === 1) {
    return (
      <div className="aspect-square w-full overflow-hidden rounded-lg relative">
        <img 
          src={imageArray[0]} 
          alt={alt}
          className="w-full h-full object-cover"
          onLoad={() => setLoading(false)}
        />
        {loading && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    );
  }
  
  const goToNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => 
      prevIndex === imageArray.length - 1 ? 0 : prevIndex + 1
    );
  };
  
  const goToPrevious = (e) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? imageArray.length - 1 : prevIndex - 1
    );
  };
  
  const goToIndex = (index) => {
    setCurrentIndex(index);
  };
  
  return (
    <div className="w-full relative">
      {/* Main Image */}
      <div className="aspect-square w-full overflow-hidden rounded-lg relative">
        <img 
          src={imageArray[currentIndex]} 
          alt={`${alt} ${currentIndex + 1}`}
          className="w-full h-full object-cover"
          onLoad={() => setLoading(false)}
        />
        
        {loading && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {/* Image Counter */}
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full">
          {currentIndex + 1} / {imageArray.length}
        </div>
      </div>
      
      {/* Navigation Arrows */}
      <button
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 p-1 rounded-full 
                  hover:bg-opacity-100 transition-all transform hover:scale-110"
        onClick={goToPrevious}
        aria-label="Previous image"
      >
        <ChevronLeft size={20} className="text-gray-800" />
      </button>
      
      <button
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 p-1 rounded-full 
                  hover:bg-opacity-100 transition-all transform hover:scale-110"
        onClick={goToNext}
        aria-label="Next image"
      >
        <ChevronRight size={20} className="text-gray-800" />
      </button>
      
      {/* Thumbnail Navigation */}
      <div className="flex justify-center mt-2 gap-2">
        {imageArray.map((image, index) => (
          <button
            key={index}
            className={`w-12 h-12 rounded-md overflow-hidden border-2 transition-all
                      ${index === currentIndex 
                        ? 'border-blue-600 opacity-100 transform scale-110' 
                        : 'border-transparent opacity-70 hover:opacity-100'}`}
            onClick={() => goToIndex(index)}
            aria-label={`Go to image ${index + 1}`}
          >
            <img 
              src={image} 
              alt={`Thumbnail ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ImageCarousel;