import React, { useState } from 'react';
import PropTypes from 'prop-types';

const MultiPaperSelector = ({ availablePapers, selectedPaperIds, onSelectionChange }) => {
  const [isMultiMode, setIsMultiMode] = useState(selectedPaperIds.length > 1);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredPapers = availablePapers.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleMode = () => {
    setIsMultiMode(!isMultiMode);
    if (isMultiMode && selectedPaperIds.length > 1) {
      onSelectionChange([selectedPaperIds[0]]);
    }
  };

  const togglePaper = (id) => {
    if (isMultiMode) {
      const newSelection = selectedPaperIds.includes(id)
        ? selectedPaperIds.filter(pId => pId !== id)
        : [...selectedPaperIds, id];
      onSelectionChange(newSelection);
    } else {
      onSelectionChange([id]);
      setIsOpen(false);
    }
  };

  const removePaper = (id) => {
    onSelectionChange(selectedPaperIds.filter(pId => pId !== id));
  };

  const selectAll = () => onSelectionChange(filteredPapers.map(p => p.id));
  const selectNone = () => onSelectionChange([]);

  return (
    <div className="relative w-full max-w-2xl mx-auto mb-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Context Source</label>
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg border border-gray-200 dark:border-gray-700">
          <button
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${!isMultiMode ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            onClick={() => { if(isMultiMode) handleToggleMode(); }}
          >
            Single Paper
          </button>
          <button
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${isMultiMode ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            onClick={() => { if(!isMultiMode) handleToggleMode(); }}
          >
            Multiple Papers
          </button>
        </div>
      </div>

      <div className="relative">
        <div 
          className="min-h-[42px] p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm cursor-pointer flex flex-wrap gap-2 items-center focus-within:ring-2 focus-within:ring-indigo-500"
          onClick={() => setIsOpen(!isOpen)}
        >
          {selectedPaperIds.length === 0 && (
            <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">Select paper(s)...</span>
          )}
          
          {selectedPaperIds.map(id => {
            const paper = availablePapers.find(p => p.id === id);
            if (!paper) return null;
            return (
              <span key={id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800/50">
                <span className="truncate max-w-[150px]">{paper.title}</span>
                {isMultiMode && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); removePaper(id); }}
                    className="hover:text-indigo-900 dark:hover:text-indigo-100 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800 p-0.5"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </span>
            );
          })}
          <div className="ml-auto mr-2">
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <input
                type="text"
                placeholder="Search papers..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onClick={e => e.stopPropagation()}
                className="w-full text-sm py-1.5 px-3 rounded-md bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900 dark:text-white"
              />
            </div>
            
            {isMultiMode && filteredPapers.length > 0 && (
              <div className="px-3 py-2 flex justify-between bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 text-xs">
                <button onClick={selectAll} className="text-indigo-600 dark:text-indigo-400 hover:underline">Select All</button>
                <button onClick={selectNone} className="text-gray-500 hover:underline">Clear</button>
              </div>
            )}

            <ul className="max-h-60 overflow-y-auto py-1">
              {filteredPapers.length === 0 ? (
                <li className="px-4 py-3 text-sm text-gray-500 text-center">No papers found</li>
              ) : (
                filteredPapers.map(paper => {
                  const isSelected = selectedPaperIds.includes(paper.id);
                  return (
                    <li 
                      key={paper.id}
                      onClick={() => togglePaper(paper.id)}
                      className={`px-3 py-2 cursor-pointer flex items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                    >
                      {isMultiMode && (
                        <div className="mr-3 flex-shrink-0">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                            {isSelected && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>}
                          </div>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className={`text-sm truncate ${isSelected ? 'font-medium text-indigo-900 dark:text-indigo-300' : 'text-gray-900 dark:text-gray-200'}`}>
                          {paper.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {paper.authors?.join(', ')}
                        </div>
                      </div>
                      {!isMultiMode && isSelected && (
                        <svg className="w-4 h-4 text-indigo-500 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

MultiPaperSelector.propTypes = {
  availablePapers: PropTypes.array.isRequired,
  selectedPaperIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSelectionChange: PropTypes.func.isRequired,
};

export default MultiPaperSelector;
