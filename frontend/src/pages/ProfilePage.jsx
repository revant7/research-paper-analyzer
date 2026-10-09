import React, { useState, useEffect } from 'react';
import { 
  FaUser, FaEnvelope, FaCalendarAlt, FaSave, 
  FaSpinner, FaFilePdf, FaAlignLeft, FaComments 
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import dashboardService from '../services/dashboardService';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ papers: 0, summaries: 0, conversations: 0 });

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    title: 'Researcher',
    institution: 'Research Lab'
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }));
    }
    loadStats();
  }, [user]);

  const loadStats = async () => {
    try {
      const data = await dashboardService.getStats();
      setStats({
        papers: data.totalPapers ?? data.total_papers ?? 0,
        summaries: data.summariesGenerated ?? data.total_summaries ?? 0,
        conversations: data.conversations ?? data.total_conversations ?? 0
      });
    } catch (err) {
      console.error("Failed to load profile activity stats", err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setIsLoading(true);
    try {
      if (updateProfile) {
        await updateProfile({ name: formData.name.trim() });
      }
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Update profile failed:", error);
      toast.error(error.response?.data?.detail || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const memberSinceFormatted = user?.created_at 
    ? new Date(user.created_at).toLocaleDateString([], { month: 'long', year: 'numeric' })
    : 'Recent Member';

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your personal information and view your activity stats.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: User Card & Stats */}
        <div className="space-y-6">
          {/* User Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
            <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/50 rounded-full mx-auto flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-3xl font-bold mb-3 shadow-xs">
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{user?.name || 'Researcher'}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-xs mb-4">{user?.email}</p>
            
            <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 py-2 rounded-lg">
              <FaCalendarAlt className="mr-2 text-indigo-500" /> Member since {memberSinceFormatted}
            </div>
          </div>

          {/* Activity Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-wider text-gray-500">
              Activity Overview
            </h3>
            <div className="space-y-3.5">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <FaFilePdf className="mr-2.5 text-blue-500" /> Papers Uploaded
                </div>
                <span className="font-bold text-gray-900 dark:text-white">{stats.papers}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <FaAlignLeft className="mr-2.5 text-emerald-500" /> Summaries Generated
                </div>
                <span className="font-bold text-gray-900 dark:text-white">{stats.summaries}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <FaComments className="mr-2.5 text-purple-500" /> Conversations
                </div>
                <span className="font-bold text-gray-900 dark:text-white">{stats.conversations}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Form */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Personal Information</h3>
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                >
                  Edit Profile
                </button>
              )}
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="text-gray-400 text-xs" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="block w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 text-sm disabled:opacity-75 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="text-gray-400 text-xs" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      disabled={true}
                      className="block w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm opacity-70 cursor-not-allowed"
                      title="Email address cannot be changed."
                    />
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="pt-4 flex justify-end gap-2 border-t border-gray-100 dark:border-gray-700 mt-5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        ...formData,
                        name: user?.name || ''
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center shadow-xs disabled:opacity-70"
                  >
                    {isLoading ? <FaSpinner className="animate-spin mr-2 text-xs" /> : <FaSave className="mr-1.5 text-xs" />}
                    Save Changes
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default ProfilePage;
