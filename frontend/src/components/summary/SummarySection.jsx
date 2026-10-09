import React, { useState } from 'react';
import PropTypes from 'prop-types';

const SummarySection = ({ title, icon, content, defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!content) return null;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm transition-all duration-200">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 focus:outline-none hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center font-semibold text-gray-900 dark:text-white text-lg">
          <span className="mr-3 text-xl">{icon}</span>
          {title}
        </div>
        <svg 
          className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      <div 
        className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
        style={{ overflow: 'hidden' }}
      >
        <div className="p-4 pt-0 text-gray-700 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700 leading-relaxed whitespace-pre-line text-sm md:text-base">
          {content}
        </div>
      </div>
    </div>
  );
};

SummarySection.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.string,
  content: PropTypes.string,
  defaultExpanded: PropTypes.bool,
};

export default SummarySection;
