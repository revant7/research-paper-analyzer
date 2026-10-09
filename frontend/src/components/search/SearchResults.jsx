import React from 'react';
import PropTypes from 'prop-types';
import SearchResultCard from './SearchResultCard';

const SearchResults = ({ results, isLoading, totalCount, onSortChange, currentSort }) => {
  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        <div className="flex justify-between items-center mb-6">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No results found</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Try adjusting your search terms or filters.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          Found {totalCount || results.length} results
        </h2>
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm text-gray-600 dark:text-gray-400">Sort by:</label>
          <select
            id="sort"
            value={currentSort}
            onChange={(e) => onSortChange && onSortChange(e.target.value)}
            className="text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:text-white"
          >
            <option value="relevance">Relevance</option>
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
          </select>
        </div>
      </div>
      <div className="space-y-4">
        {results.map((result) => (
          <SearchResultCard key={result.id} result={result} />
        ))}
      </div>
    </div>
  );
};

SearchResults.propTypes = {
  results: PropTypes.array,
  isLoading: PropTypes.bool,
  totalCount: PropTypes.number,
  onSortChange: PropTypes.func,
  currentSort: PropTypes.string,
};

SearchResults.defaultProps = {
  currentSort: 'relevance',
  results: [],
};

export default SearchResults;
