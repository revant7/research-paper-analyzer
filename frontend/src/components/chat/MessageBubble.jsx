import React from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import CitationCard from './CitationCard';

const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400'
          }`}>
            {isUser ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            )}
          </div>
        </div>

        {/* Message Content */}
        <div className="flex flex-col min-w-0">
          <div className={`px-4 py-3 rounded-2xl shadow-sm ${
            isUser 
              ? 'bg-indigo-600 text-white rounded-tr-none' 
              : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-tl-none'
          }`}>
            {isUser ? (
              <p className="whitespace-pre-wrap text-sm md:text-base">{message.content}</p>
            ) : (
              <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-gray-100 dark:prose-pre:bg-gray-900">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            )}
          </div>
          
          <div className={`text-xs text-gray-400 mt-1 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            {message.timestamp && new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>

          {/* Citations if any (only on assistant messages) */}
          {!isUser && message.citations && message.citations.length > 0 && (
            <div className="mt-3 space-y-2 w-full">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sources</p>
              <div className="flex flex-col gap-2">
                {message.citations.map((cite, i) => (
                  <CitationCard key={i} citation={cite} />
                ))}
              </div>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

MessageBubble.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    role: PropTypes.oneOf(['user', 'assistant']).isRequired,
    content: PropTypes.string.isRequired,
    timestamp: PropTypes.string,
    citations: PropTypes.array,
  }).isRequired,
};

export default MessageBubble;
