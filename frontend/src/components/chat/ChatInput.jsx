import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

const ChatInput = ({ onSend, isLoading, placeholder = "Ask a question..." }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`; // Max height approx 4 lines
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (trimmed && !isLoading) {
      onSend(trimmed);
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
      <div className="relative flex items-end w-full max-w-4xl mx-auto bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 overflow-hidden shadow-sm transition-shadow">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder={placeholder}
          className="w-full max-h-[120px] bg-transparent border-0 focus:ring-0 resize-none py-3 pl-4 pr-12 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 overflow-y-auto"
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className={`absolute right-2 bottom-2 p-1.5 rounded-xl flex items-center justify-center transition-colors ${
            input.trim() && !isLoading
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
          }`}
        >
          <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19V5m0 0l-7 7m7-7l7 7" />
          </svg>
        </button>
      </div>
      <div className="text-center mt-2">
        <span className="text-[10px] text-gray-400 dark:text-gray-500">Press Enter to send, Shift+Enter for new line</span>
      </div>
    </div>
  );
};

ChatInput.propTypes = {
  onSend: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  placeholder: PropTypes.string,
};

export default ChatInput;
