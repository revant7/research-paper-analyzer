import React from 'react';
import PropTypes from 'prop-types';

const ViewerToolbar = ({ paper, onBack, onDownload }) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm h-14">
      <div className="flex items-center flex-1 min-w-0 mr-4">
        <button 
          onClick={onBack}
          className="mr-3 p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
          title="Back to Papers"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-gray-900 dark:text-white truncate" title={paper?.title}>
            {paper?.title || 'Loading paper...'}
          </h1>
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            <span className="truncate max-w-[200px] sm:max-w-md">{paper?.authors?.join(', ') || 'Unknown Authors'}</span>
            {paper?.pageCount && (
              <>
                <span className="mx-2">•</span>
                <span>{paper.pageCount} pages</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onDownload}
          className="p-1.5 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
          title="Download PDF"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
        </button>
        {/* Optional Share button */}
        <button
          className="p-1.5 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors hidden sm:block"
          title="Share"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
        </button>
      </div>
    </div>
  );
};

ViewerToolbar.propTypes = {
  paper: PropTypes.object,
  onBack: PropTypes.func.isRequired,
  onDownload: PropTypes.func.isRequired,
};

export default ViewerToolbar;
