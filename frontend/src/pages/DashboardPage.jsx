import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaFilePdf, FaAlignLeft, FaComments, FaSearch, 
  FaUpload, FaPlus, FaCheckCircle, FaSpinner, 
  FaExclamationCircle, FaClock
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import dashboardService from '../services/dashboardService';

const DashboardPage = () => {
  const { user } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [recentPapers, setRecentPapers] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const data = await dashboardService.getStats();
      
      setStats({
        totalPapers: data.totalPapers ?? data.total_papers ?? 0,
        summariesGenerated: data.summariesGenerated ?? data.total_summaries ?? 0,
        conversations: data.conversations ?? data.total_conversations ?? 0,
        searches: data.searches ?? data.total_searches ?? 0
      });
      
      setRecentPapers(data.recentPapers || data.recent_papers || []);
      setRecentChats(data.recentConversations || data.recent_conversations || []);
      
    } catch (error) {
      console.error("Dashboard stats error:", error);
      toast.error("Failed to load dashboard metrics");
    } finally {
      setIsLoading(false);
    }
  };

  const StatusBadge = ({ status }) => {
    switch(status) {
      case 'completed': 
        return <span className="flex items-center text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full"><FaCheckCircle className="mr-1" /> Ready</span>;
      case 'processing': 
        return <span className="flex items-center text-xs font-medium text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-full"><FaSpinner className="mr-1 animate-spin" /> Processing</span>;
      case 'failed': 
        return <span className="flex items-center text-xs font-medium text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full"><FaExclamationCircle className="mr-1" /> Failed</span>;
      case 'pending': 
        return <span className="flex items-center text-xs font-medium text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-1 rounded-full"><FaClock className="mr-1" /> Pending</span>;
      default: 
        return <span className="flex items-center text-xs font-medium text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">{status}</span>;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toISOString().split('T')[0];
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name || 'Researcher'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Here's an overview of your research workspace.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/upload" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
            <FaUpload /> Upload Paper
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard 
          icon={<FaFilePdf className="text-blue-500" />} 
          title="Total Papers" 
          value={isLoading ? null : stats?.totalPapers} 
          bgColor="bg-blue-50 dark:bg-blue-900/20"
        />
        <StatCard 
          icon={<FaAlignLeft className="text-emerald-500" />} 
          title="Summaries Generated" 
          value={isLoading ? null : stats?.summariesGenerated} 
          bgColor="bg-emerald-50 dark:bg-emerald-900/20"
        />
        <StatCard 
          icon={<FaComments className="text-purple-500" />} 
          title="Conversations" 
          value={isLoading ? null : stats?.conversations} 
          bgColor="bg-purple-50 dark:bg-purple-900/20"
        />
        <StatCard 
          icon={<FaSearch className="text-orange-500" />} 
          title="Searches" 
          value={isLoading ? null : stats?.searches} 
          bgColor="bg-orange-50 dark:bg-orange-900/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Papers */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Papers</h2>
            <Link to="/papers" className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium">View all</Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-gray-500 dark:text-gray-400 text-sm border-b border-gray-100 dark:border-gray-700">
                  <th className="pb-3 font-medium">Paper Title</th>
                  <th className="pb-3 font-medium">Upload Date</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i} className="border-b border-gray-50 dark:border-gray-700/50">
                      <td className="py-4"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div></td>
                      <td className="py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div></td>
                      <td className="py-4"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20 animate-pulse"></div></td>
                      <td className="py-4 text-right"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12 ml-auto animate-pulse"></div></td>
                    </tr>
                  ))
                ) : recentPapers.length > 0 ? (
                  recentPapers.map(paper => (
                    <tr key={paper.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                      <td className="py-4 pr-4">
                        <div className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[250px] sm:max-w-xs">{paper.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[250px] sm:max-w-xs">{paper.authors || 'Unknown authors'}</div>
                      </td>
                      <td className="py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(paper.upload_date || paper.uploadDate)}
                      </td>
                      <td className="py-4 whitespace-nowrap">
                        <StatusBadge status={paper.processing_status || paper.status} />
                      </td>
                      <td className="py-4 text-right">
                        <Link to={`/papers/${paper.id}`} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-500 dark:text-gray-400">
                      No papers uploaded yet. <Link to="/upload" className="text-indigo-600 dark:text-indigo-400 underline">Upload your first paper</Link>.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions & Recent Chats */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link to="/search" className="flex items-center p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                  <FaSearch />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Semantic Search</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Search across all your papers</p>
                </div>
              </Link>
              
              <Link to="/chat" className="flex items-center p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                  <FaPlus />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">New Conversation</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Chat with research papers</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Chats */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Chats</h2>
              <Link to="/history" className="text-sm text-indigo-600 dark:text-indigo-400">View all</Link>
            </div>
            
            <div className="space-y-3">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0 animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
                    </div>
                  </div>
                ))
              ) : recentChats.length > 0 ? (
                recentChats.map(chat => (
                  <Link key={chat.id} to={`/chat/${chat.id}`} className="flex gap-3 p-2 -mx-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 shrink-0">
                      <FaComments className="text-sm" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">{chat.title || 'Untitled Chat'}</h4>
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        <span className="truncate max-w-[120px]">{chat.paper_name || chat.paperName || 'General'}</span>
                        <span className="mx-1">•</span>
                        <span>{formatDate(chat.created_at || chat.createdAt)}</span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">No recent conversations.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, bgColor }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${bgColor}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
      {value === null || value === undefined ? (
        <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded mt-1 animate-pulse"></div>
      ) : (
        <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</h3>
      )}
    </div>
  </div>
);

export default DashboardPage;
