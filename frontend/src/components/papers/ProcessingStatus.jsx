import React from 'react';
import PropTypes from 'prop-types';

const ProcessingStatus = ({ status, errorMsg, animated = true }) => {
  const getStatusContent = () => {
    switch (status) {
      case 'pending':
        return {
          icon: <div className={`w-3 h-3 rounded-full bg-yellow-400 ${animated ? 'animate-pulse' : ''}`}></div>,
          text: 'Pending',
          colorClass: 'text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
        };
      case 'processing':
        return {
          icon: (
            <svg className={`w-4 h-4 text-blue-500 ${animated ? 'animate-spin' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ),
          text: 'Processing',
          colorClass: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
        };
      case 'completed':
        return {
          icon: (
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          ),
          text: 'Completed',
          colorClass: 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
        };
      case 'failed':
        return {
          icon: (
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          ),
          text: 'Failed',
          colorClass: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        };
      default:
        return {
          icon: <div className="w-3 h-3 rounded-full bg-gray-400"></div>,
          text: 'Unknown',
          colorClass: 'text-gray-700 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        };
    }
  };

  const content = getStatusContent();

  return (
    <div className={`flex flex-col sm:flex-row items-center gap-2 p-3 rounded-md border ${content.colorClass} transition-all duration-300`}>
      <div className="flex items-center gap-2 font-medium">
        {content.icon}
        <span>{content.text}</span>
      </div>
      {status === 'failed' && errorMsg && (
        <span className="text-sm opacity-80 sm:ml-2 border-t sm:border-t-0 sm:border-l border-current pt-2 sm:pt-0 sm:pl-2">
          {errorMsg}
        </span>
      )}
    </div>
  );
};

ProcessingStatus.propTypes = {
  status: PropTypes.oneOf(['pending', 'processing', 'completed', 'failed']).isRequired,
  errorMsg: PropTypes.string,
  animated: PropTypes.bool,
};

export default ProcessingStatus;
