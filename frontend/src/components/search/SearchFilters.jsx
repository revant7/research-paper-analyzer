import React, { useState } from 'react';
import PropTypes from 'prop-types';

const SearchFilters = ({ filters, onApply, onClear }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters || {
    fromDate: '',
    toDate: '',
    limit: 10,
  });

  const handleChange = (field, value) => {
    setLocalFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApply = () => {
    onApply(localFilters);
    if (window.innerWidth < 768) setIsOpen(false);
  };

  const handleClear = () => {
    const empty = { fromDate: '', toDate: '', limit: 10 };
    setLocalFilters(empty);
    onClear(empty);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div 
        className="p-4 flex justify-between items-center md:cursor-default cursor-pointer md:pb-4 border-b border-gray-100 dark:border-gray-700 md:border-none"
        onClick={() => window.innerWidth < 768 && setIsOpen(!isOpen)}
      >
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
          <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
        </h3>
        <button className="md:hidden text-gray-500">
          <svg className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div className={`p-4 pt-0 md:block space-y-4 ${isOpen ? 'block' : 'hidden'}`}>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Date Range</label>
          <div className="space-y-2">
            <input
              type="date"
              value={localFilters.fromDate}
              onChange={(e) => handleChange('fromDate', e.target.value)}
              className="w-full text-sm rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="From"
            />
            <input
              type="date"
              value={localFilters.toDate}
              onChange={(e) => handleChange('toDate', e.target.value)}
              className="w-full text-sm rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="To"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Results Limit</label>
          <select
            value={localFilters.limit}
            onChange={(e) => handleChange('limit', Number(e.target.value))}
            className="w-full text-sm rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value={5}>5 results</option>
            <option value={10}>10 results</option>
            <option value={20}>20 results</option>
            <option value={50}>50 results</option>
          </select>
        </div>

        <div className="pt-2 flex gap-2">
          <button
            onClick={handleClear}
            className="flex-1 py-1.5 px-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-1.5 px-3 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

SearchFilters.propTypes = {
  filters: PropTypes.object,
  onApply: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
};

export default SearchFilters;
