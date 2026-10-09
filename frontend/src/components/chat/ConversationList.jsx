import React from 'react';
import PropTypes from 'prop-types';

const ConversationList = ({ conversations, activeId, onSelect, onDelete, onNewChat }) => {
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 scroll-smooth">
        {conversations.length === 0 ? (
          <div className="text-center py-8 px-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">No conversations yet.</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                activeId === conv.id
                  ? 'bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700'
                  : 'hover:bg-gray-200/50 dark:hover:bg-gray-800/50 border border-transparent'
              }`}
            >
              <div className="min-w-0 flex-1 mr-2">
                <h4 className={`text-sm font-medium truncate ${
                  activeId === conv.id ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {conv.title || 'New Conversation'}
                </h4>
                <div className="flex items-center text-xs mt-1 text-gray-500 dark:text-gray-500">
                  <span className="truncate">{conv.paperName || 'Multiple Papers'}</span>
                  <span className="mx-1">•</span>
                  <span>{new Date(conv.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(conv.id);
                }}
                className={`p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors ${
                  activeId === conv.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                title="Delete chat"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

ConversationList.propTypes = {
  conversations: PropTypes.array.isRequired,
  activeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSelect: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onNewChat: PropTypes.func.isRequired,
};

export default ConversationList;
