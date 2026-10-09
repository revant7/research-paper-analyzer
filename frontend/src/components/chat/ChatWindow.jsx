import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import MessageBubble from './MessageBubble';

const ChatWindow = ({ messages, isLoading, onSuggestedClick }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const suggestedQuestions = [
    "What is the main contribution of this paper?",
    "Explain the methodology used.",
    "What are the limitations mentioned?",
    "Summarize the experimental results."
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Start a conversation</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
              Ask questions about the paper(s) to get insights, summaries, or specific details.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => onSuggestedClick && onSuggestedClick(q)}
                  className="text-left text-sm p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-sm transition-all text-gray-700 dark:text-gray-300"
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <MessageBubble key={msg.id || idx} message={msg} />
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

ChatWindow.propTypes = {
  messages: PropTypes.array.isRequired,
  isLoading: PropTypes.bool,
  onSuggestedClick: PropTypes.func,
};

export default ChatWindow;
