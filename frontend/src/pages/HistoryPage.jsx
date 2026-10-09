import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaHistory, FaSearch, FaCommentAlt, 
  FaCalendarDay, FaCalendarWeek, FaCalendarAlt,
  FaArrowRight, FaSpinner
} from 'react-icons/fa';
import searchService from '../services/searchService';
import chatService from '../services/chatService';

const HistoryPage = () => {
  const [activeTab, setActiveTab] = useState('search');
  const [searchHistory, setSearchHistory] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistoryData();
  }, []);

  const fetchHistoryData = async () => {
    setIsLoading(true);
    try {
      const [searches, chats] = await Promise.all([
        searchService.getSearchHistory().catch(() => []),
        chatService.getConversations().catch(() => [])
      ]);
      setSearchHistory(Array.isArray(searches) ? searches : []);
      setChatHistory(Array.isArray(chats) ? chats : []);
    } catch (err) {
      console.error("Failed to load activity history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getGroupLabel = (dateStr) => {
    if (!dateStr) return 'Older';
    try {
      const itemDate = new Date(dateStr);
      const now = new Date();
      const diffMs = now - itemDate;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays <= 7) return 'This Week';
      return 'Older';
    } catch {
      return 'Older';
    }
  };

  const formatItemTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return dateStr;
    }
  };

  const renderHistoryGroup = (items, type) => {
    const grouped = items.reduce((acc, item) => {
      const groupKey = getGroupLabel(item.created_at);
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(item);
      return acc;
    }, {});

    const groupOrder = ['Today', 'Yesterday', 'This Week', 'Older'];

    return groupOrder.filter(grp => grouped[grp] && grouped[grp].length > 0).map(group => (
      <div key={group} className="mb-8">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          {group === 'Today' && <FaCalendarDay />}
          {group === 'Yesterday' && <FaCalendarDay />}
          {group === 'This Week' && <FaCalendarWeek />}
          {group === 'Older' && <FaCalendarAlt />}
          {group}
        </h3>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-xs">
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {grouped[group].map(item => (
              <li key={item.id}>
                {type === 'search' ? (
                  <Link 
                    to={`/search?q=${encodeURIComponent(item.query)}`}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between group block"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-1 text-gray-400"><FaSearch className="text-sm" /></div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-gray-900 dark:text-white truncate">"{item.query}"</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {formatItemTime(item.created_at)} {item.results_count !== undefined ? `• ${item.results_count} results` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full shrink-0">
                      <FaArrowRight className="text-xs" />
                    </div>
                  </Link>
                ) : (
                  <Link 
                    to={`/chat/${item.id}`} 
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between group block"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-1 text-gray-400"><FaCommentAlt className="text-sm" /></div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                          {item.title || 'Untitled Conversation'}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                          <span>{item.paper_name || (item.paper_ids?.length ? `${item.paper_ids.length} papers` : 'General')}</span>
                          <span>•</span>
                          <span>{formatItemTime(item.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity p-2 shrink-0">
                      <FaArrowRight className="text-xs" />
                    </div>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    ));
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <FaHistory className="text-indigo-500" /> Activity History
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">Review your past semantic searches and paper conversations.</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-8 border border-gray-200 dark:border-gray-700 max-w-md">
        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg flex justify-center items-center gap-2 transition-all ${
            activeTab === 'search' 
              ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-xs' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <FaSearch className="text-xs" /> Search History
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg flex justify-center items-center gap-2 transition-all ${
            activeTab === 'chat' 
              ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-xs' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <FaCommentAlt className="text-xs" /> Chat History
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <FaSpinner className="animate-spin text-3xl text-indigo-600 mb-3" />
          <p className="text-sm">Loading activity logs...</p>
        </div>
      ) : (
        <div className="animate-fadeIn">
          {activeTab === 'search' ? (
            searchHistory.length > 0 ? renderHistoryGroup(searchHistory, 'search') : (
              <EmptyState icon={<FaSearch />} message="No search history found" subMessage="Your recent semantic searches will appear here automatically." />
            )
          ) : (
            chatHistory.length > 0 ? renderHistoryGroup(chatHistory, 'chat') : (
              <EmptyState icon={<FaCommentAlt />} message="No chat history found" subMessage="Conversations you initiate with papers will be preserved here." />
            )
          )}
        </div>
      )}
    </div>
  );
};

const EmptyState = ({ icon, message, subMessage }) => (
  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 border-dashed rounded-xl p-12 text-center flex flex-col items-center mt-6">
    <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-400 text-xl mb-3">
      {icon}
    </div>
    <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">{message}</h3>
    <p className="text-xs text-gray-500 dark:text-gray-400">{subMessage}</p>
  </div>
);

export default HistoryPage;
