import React from 'react';
import PropTypes from 'prop-types';

const PaperCard = ({ paper, onClick, onDelete, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
        <div className="flex justify-between items-center">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  const { id, title, authors, uploadDate, status, pageCount, summaryStatus } = paper;

  const getStatusColor = (s) => {
    switch (s) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200 dark:border-gray-700 cursor-pointer relative group flex flex-col h-full"
      onClick={() => onClick(id)}
    >
      <div className="flex-grow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2" title={title}>
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-1" title={authors?.join(', ')}>
          {authors?.join(', ') || 'Unknown Authors'}
        </p>
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
        <span>{new Date(uploadDate).toLocaleDateString()}</span>
        <span>{pageCount} pages</span>
      </div>

      <div className="mt-3 flex justify-between items-center">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
          {status}
        </span>
        {summaryStatus === 'generated' && (
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Summary ✓</span>
        )}
      </div>

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(id); }}
          className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
          title="Delete"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
    </div>
  );
};

PaperCard.propTypes = {
  paper: PropTypes.object,
  onClick: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

PaperCard.defaultProps = {
  isLoading: false,
  paper: {},
};

export default PaperCard;
