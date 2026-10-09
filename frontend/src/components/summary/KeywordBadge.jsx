import React from 'react';
import PropTypes from 'prop-types';

const KeywordBadge = ({ keyword, onRemove }) => {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 hover:shadow-sm transition-shadow">
      {keyword}
      {onRemove && (
        <button 
          onClick={onRemove}
          className="ml-1.5 -mr-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
};

KeywordBadge.propTypes = {
  keyword: PropTypes.string.isRequired,
  onRemove: PropTypes.func,
};

export default KeywordBadge;
