import React, { useState } from 'react';
import PropTypes from 'prop-types';

const PdfViewer = ({ url }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => setIsLoading(false);
  const handleError = () => {
    setIsLoading(false);
    setError(true);
  };

  if (!url) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
        No PDF selected
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-gray-200 dark:bg-gray-800 flex flex-col">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-10">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Loading PDF...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-20">
          <div className="text-center p-6 max-w-sm">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Failed to load PDF</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">The file might be corrupted, or the URL is invalid.</p>
            <a href={url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-sm font-medium">
              Try opening in new tab
            </a>
          </div>
        </div>
      )}

      <iframe
        src={`${url}#toolbar=0`}
        className="w-full h-full border-none flex-grow"
        title="PDF Viewer"
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
};

PdfViewer.propTypes = {
  url: PropTypes.string,
};

export default PdfViewer;
