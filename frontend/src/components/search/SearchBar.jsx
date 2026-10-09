import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const SearchBar = ({ onSearch, initialValue = '', placeholder = 'Search papers...', size = 'md' }) => {
  const [query, setQuery] = useState(initialValue);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  const handleClear = () => {
    setQuery('');
    // Optionally trigger empty search or just clear
  };

  const sizeClasses = {
    sm: 'py-1.5 pl-9 pr-8 text-sm',
    md: 'py-2 pl-10 pr-10 text-base',
    lg: 'py-3 pl-12 pr-12 text-lg',
  };

  const iconClasses = {
    sm: 'w-4 h-4 left-3',
    md: 'w-5 h-5 left-3',
    lg: 'w-6 h-6 left-4',
  };

  const clearIconClasses = {
    sm: 'w-4 h-4 right-2',
    md: 'w-5 h-5 right-2.5',
    lg: 'w-6 h-6 right-3',
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-3xl mx-auto">
      <div className="relative flex items-center w-full">
        <svg 
          className={`absolute text-gray-400 ${iconClasses[size]}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400 text-gray-900 dark:text-white shadow-sm transition-shadow ${sizeClasses[size]}`}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className={`absolute text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 ${clearIconClasses[size]}`}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </form>
  );
};

SearchBar.propTypes = {
  onSearch: PropTypes.func.isRequired,
  initialValue: PropTypes.string,
  placeholder: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
};

export default SearchBar;
