import React from 'react';
import PropTypes from 'prop-types';

const CitationCard = ({ citation }) => {
  const title = citation.title || citation.paper_title || 'Document excerpt';
  const pageNumber = citation.pageNumber || citation.page_number || citation.page;
  const excerpt = citation.excerpt || citation.content || citation.text;
  const paperId = citation.paperId || citation.paper_id;
  
  return (
    <a 
      href={paperId ? `/papers/${paperId}${pageNumber ? `?page=${pageNumber}` : ''}` : '#'}
      className="block bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors border-l-2 border-l-indigo-400 dark:border-l-indigo-500 text-left group"
    >
      <div className="flex items-start gap-2">
        <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <div className="min-w-0 flex-1">
          <div className="flex justify-between items-start gap-2">
            <h4 className="text-xs font-medium text-gray-900 dark:text-white truncate" title={title}>
              {title}
            </h4>
            {pageNumber && (
              <span className="text-[10px] font-mono bg-white dark:bg-gray-900 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400 whitespace-nowrap">
                p. {pageNumber}
              </span>
            )}
          </div>
          {excerpt && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2 italic">
              "{excerpt}"
            </p>
          )}
        </div>
      </div>
    </a>
  );
};

CitationCard.propTypes = {
  citation: PropTypes.shape({
    title: PropTypes.string,
    paper_title: PropTypes.string,
    pageNumber: PropTypes.number,
    page_number: PropTypes.number,
    excerpt: PropTypes.string,
    content: PropTypes.string,
    paperId: PropTypes.string,
    paper_id: PropTypes.string,
  }).isRequired,
};

export default CitationCard;
