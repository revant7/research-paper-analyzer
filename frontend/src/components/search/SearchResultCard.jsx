import React from 'react';
import PropTypes from 'prop-types';

const SearchResultCard = ({ result }) => {
  const { paperId, title, authors, score, excerpt, pageNumber } = result;

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
    return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
  };

  const getBorderColor = (score) => {
    if (score >= 80) return 'border-l-green-500';
    if (score >= 50) return 'border-l-yellow-500';
    return 'border-l-red-500';
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700 border-l-4 ${getBorderColor(score)}`}>
      <div className="flex justify-between items-start mb-2 gap-4">
        <a href={`/papers/${paperId}`} className="text-lg font-medium text-indigo-600 dark:text-indigo-400 hover:underline hover:text-indigo-800 dark:hover:text-indigo-300 line-clamp-2">
          {title}
        </a>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getScoreColor(score)} whitespace-nowrap`}>
          {Math.round(score)}% Match
        </span>
      </div>
      
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-1">
        {authors?.join(', ') || 'Unknown Authors'}
      </p>

      <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 mb-3 text-sm text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700">
        <p className="italic line-clamp-3">"...{excerpt}..."</p>
      </div>

      <div className="flex justify-between items-center text-xs">
        <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium">
          Page {pageNumber || '?'}
        </span>
        <a href={`/papers/${paperId}?page=${pageNumber}`} className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center">
          View in context
          <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
          </svg>
        </a>
      </div>
    </div>
  );
};

SearchResultCard.propTypes = {
  result: PropTypes.shape({
    id: PropTypes.string,
    paperId: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    authors: PropTypes.arrayOf(PropTypes.string),
    score: PropTypes.number.isRequired,
    excerpt: PropTypes.string.isRequired,
    pageNumber: PropTypes.number,
  }).isRequired,
};

export default SearchResultCard;
