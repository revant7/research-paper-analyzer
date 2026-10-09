import React from 'react';
import PropTypes from 'prop-types';

const TldrCard = ({ content }) => {
  if (!content) return null;
  
  return (
    <div className="bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500 rounded-r-xl p-5 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <svg className="w-24 h-24 text-indigo-900 dark:text-indigo-100" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
        </svg>
      </div>
      
      <div className="relative z-10">
        <h3 className="text-sm font-bold tracking-wider text-indigo-800 dark:text-indigo-300 uppercase mb-2">TL;DR</h3>
        <p className="text-gray-800 dark:text-gray-200 text-lg leading-relaxed font-medium">
          {content}
        </p>
      </div>
    </div>
  );
};

TldrCard.propTypes = {
  content: PropTypes.string,
};

export default TldrCard;
