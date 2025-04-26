import React, { useState } from 'react';
import { Search, Filter, Tag, X, ChevronDown } from 'lucide-react';

const EnhancedFilters = ({ 
  searchTerm, 
  setSearchTerm, 
  activeFilter, 
  setActiveFilter, 
  categoryFilter, 
  setCategoryFilter,
  itemCategories,
  serviceCategories,
  contentTypeFilter,
  setContentTypeFilter,
  sortOrder,
  setSortOrder,
  colors
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setActiveFilter('all');
    setCategoryFilter('');
    setContentTypeFilter('all');
    setSortOrder('newest');
  };

  // Combine categories
  const allCategories = [...new Set([...itemCategories, ...serviceCategories])].sort();
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex flex-col gap-4">
        {/* Search and Reset */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search listings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          </div>
          
          {/* Advanced Filter Toggle Button */}
          <button
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg flex items-center"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <Filter size={18} className="mr-2 text-gray-400" />
            <span className="hidden sm:inline text-gray-600">Filters</span>
            <ChevronDown 
              size={16} 
              className={`ml-1 text-gray-400 transform transition-transform duration-200 ${showAdvancedFilters ? 'rotate-180' : ''}`} 
            />
          </button>
          
          {/* Reset Button - Only show if any filter is active */}
          {(searchTerm || activeFilter !== 'all' || categoryFilter || contentTypeFilter !== 'all' || sortOrder !== 'newest') && (
            <button
              className="px-3 py-2 text-red-500 border border-gray-200 rounded-lg flex items-center hover:bg-red-50"
              onClick={resetFilters}
            >
              <X size={18} className="mr-1" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
        
        {/* Basic Filters (always visible) */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Offer Type Filter */}
          <div className="flex rounded-lg overflow-hidden shadow-sm border border-gray-100 w-full sm:w-auto">
            <button
              className="flex-1 px-4 py-2 font-medium text-sm transition-colors"
              style={{ 
                backgroundColor: activeFilter === 'all' ? colors.primary : colors.white,
                color: activeFilter === 'all' ? colors.white : colors.textPrimary
              }}
              onClick={() => setActiveFilter('all')}
            >
              All
            </button>
            <button
              className="flex-1 px-4 py-2 font-medium text-sm transition-colors"
              style={{ 
                backgroundColor: activeFilter === 'offering' ? colors.offering : colors.white,
                color: activeFilter === 'offering' ? colors.white : colors.textPrimary
              }}
              onClick={() => setActiveFilter('offering')}
            >
              Offerings
            </button>
            <button
              className="flex-1 px-4 py-2 font-medium text-sm transition-colors"
              style={{ 
                backgroundColor: activeFilter === 'requesting' ? colors.requesting : colors.white,
                color: activeFilter === 'requesting' ? colors.white : colors.textPrimary
              }}
              onClick={() => setActiveFilter('requesting')}
            >
              Requests
            </button>
          </div>
          
          {/* Category Filter */}
          <div className="relative flex-1 min-w-[180px]">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full appearance-none pl-10 pr-8 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {allCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <Tag className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
        </div>
        
        {/* Advanced Filters (expandable) */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Content Type Filter */}
              <div>
                <label className="block mb-2 text-sm text-gray-600">Content Type</label>
                <div className="flex rounded-lg overflow-hidden shadow-sm border border-gray-100">
                  <button
                    className="flex-1 px-4 py-2 font-medium text-sm transition-colors"
                    style={{ 
                      backgroundColor: contentTypeFilter === 'all' ? colors.primary : colors.white,
                      color: contentTypeFilter === 'all' ? colors.white : colors.textPrimary
                    }}
                    onClick={() => setContentTypeFilter('all')}
                  >
                    All
                  </button>
                  <button
                    className="flex-1 px-4 py-2 font-medium text-sm transition-colors"
                    style={{ 
                      backgroundColor: contentTypeFilter === 'item' ? colors.primary : colors.white,
                      color: contentTypeFilter === 'item' ? colors.white : colors.textPrimary
                    }}
                    onClick={() => setContentTypeFilter('item')}
                  >
                    Items
                  </button>
                  <button
                    className="flex-1 px-4 py-2 font-medium text-sm transition-colors"
                    style={{ 
                      backgroundColor: contentTypeFilter === 'service' ? colors.primary : colors.white,
                      color: contentTypeFilter === 'service' ? colors.white : colors.textPrimary
                    }}
                    onClick={() => setContentTypeFilter('service')}
                  >
                    Services
                  </button>
                </div>
              </div>
              
              {/* Sort Order */}
              <div>
                <label className="block mb-2 text-sm text-gray-600">Sort By</label>
                <div className="flex rounded-lg overflow-hidden shadow-sm border border-gray-100">
                  <button
                    className="flex-1 px-4 py-2 font-medium text-sm transition-colors"
                    style={{ 
                      backgroundColor: sortOrder === 'newest' ? colors.primary : colors.white,
                      color: sortOrder === 'newest' ? colors.white : colors.textPrimary
                    }}
                    onClick={() => setSortOrder('newest')}
                  >
                    Newest
                  </button>
                  <button
                    className="flex-1 px-4 py-2 font-medium text-sm transition-colors"
                    style={{ 
                      backgroundColor: sortOrder === 'popular' ? colors.primary : colors.white,
                      color: sortOrder === 'popular' ? colors.white : colors.textPrimary
                    }}
                    onClick={() => setSortOrder('popular')}
                  >
                    Most Popular
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedFilters;