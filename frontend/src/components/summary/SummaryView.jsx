import React from 'react';
import PropTypes from 'prop-types';
import TldrCard from './TldrCard';
import SummarySection from './SummarySection';
import KeywordBadge from './KeywordBadge';

const SummaryView = ({ summary, isLoading, onRegenerate, onGenerate }) => {
  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto p-4 animate-pulse">
        <div className="h-32 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800"></div>
        <div className="flex gap-2">
          {[1,2,3,4].map(i => <div key={i} className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>)}
        </div>
        {[1,2,3].map(i => (
          <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="h-6 w-1/3 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 w-4/6 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-4">
        <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Summary Available</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
          A detailed summary hasn't been generated for this paper yet. Generate one to quickly understand the key concepts.
        </p>
        <button
          onClick={onGenerate}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          Generate Summary
        </button>
      </div>
    );
  }

  const sections = [
    { id: 'objective', title: 'Research Objective', content: summary.objective, icon: '🎯' },
    { id: 'problem', title: 'Problem Statement', content: summary.problemStatement, icon: '❓' },
    { id: 'methodology', title: 'Methodology', content: summary.methodology, icon: '🧪' },
    { id: 'dataset', title: 'Dataset', content: summary.dataset, icon: '📊' },
    { id: 'results', title: 'Results', content: summary.results, icon: '📈' },
    { id: 'limitations', title: 'Limitations', content: summary.limitations, icon: '⚠️' },
    { id: 'conclusion', title: 'Conclusion', content: summary.conclusion, icon: '🏁' },
    { id: 'futureScope', title: 'Future Scope', content: summary.futureScope, icon: '🚀' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Paper Summary</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Generated on {new Date(summary.generatedAt || Date.now()).toLocaleDateString()}</p>
        </div>
        <button 
          onClick={onRegenerate}
          className="text-sm flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Regenerate
        </button>
      </div>

      <TldrCard content={summary.tldr} />

      {summary.keywords && summary.keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {summary.keywords.map((kw, i) => (
            <KeywordBadge key={i} keyword={kw} />
          ))}
        </div>
      )}

      {summary.keyContributions && summary.keyContributions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="mr-2">✨</span> Key Contributions
          </h3>
          <ul className="space-y-2 pl-2">
            {summary.keyContributions.map((contrib, i) => (
              <li key={i} className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-gray-700 dark:text-gray-300 text-sm md:text-base leading-relaxed">
                  {contrib}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-4">
        {sections.map((section, idx) => (
          section.content ? (
            <SummarySection 
              key={section.id} 
              title={section.title} 
              icon={section.icon}
              content={section.content}
              defaultExpanded={idx < 3}
            />
          ) : null
        ))}
      </div>
    </div>
  );
};

SummaryView.propTypes = {
  summary: PropTypes.object,
  isLoading: PropTypes.bool,
  onRegenerate: PropTypes.func,
  onGenerate: PropTypes.func,
};

export default SummaryView;
