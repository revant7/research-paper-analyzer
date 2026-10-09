import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaMoon, FaSun, FaLock, FaExclamationTriangle, 
  FaCheck, FaSpinner, FaDesktop 
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';

const SettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwords.new.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }
    
    setIsLoading(true);
    try {
      await authService.changePassword(passwords.current, passwords.new);
      toast.success("Password updated successfully");
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err) {
      console.error("Password change failed:", err);
      toast.error(err.response?.data?.detail || "Failed to update password. Verify your current password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await authService.deleteAccount();
      toast.success("Account and associated data deleted permanently.");
      logout();
      navigate('/login');
    } catch (err) {
      console.error("Delete account failed:", err);
      toast.error(err.response?.data?.detail || "Failed to delete account");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage app preferences and account security.</p>
      </div>

      <div className="space-y-8">
        
        {/* Appearance Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FaSun className="text-amber-500" /> Interface Appearance
            </h2>
          </div>
          <div className="p-6">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">Select your preferred color theme for the workspace.</p>
            
            <div className="flex flex-wrap gap-4">
              <label className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all w-32 ${theme === 'light' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                <input type="radio" name="theme" value="light" className="sr-only" onChange={() => setTheme('light')} checked={theme === 'light'} />
                <FaSun className="text-2xl text-amber-500 mb-2" />
                <span className="text-xs font-medium text-gray-900 dark:text-white">Light Mode</span>
                {theme === 'light' && <div className="absolute top-2 right-2 text-indigo-600 text-xs"><FaCheck /></div>}
              </label>
              
              <label className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all w-32 ${theme === 'dark' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                <input type="radio" name="theme" value="dark" className="sr-only" onChange={() => setTheme('dark')} checked={theme === 'dark'} />
                <FaMoon className="text-2xl text-indigo-400 mb-2" />
                <span className="text-xs font-medium text-gray-900 dark:text-white">Dark Mode</span>
                {theme === 'dark' && <div className="absolute top-2 right-2 text-indigo-600 text-xs"><FaCheck /></div>}
              </label>
              
              <label className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all w-32 ${theme === 'system' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                <input type="radio" name="theme" value="system" className="sr-only" onChange={() => setTheme('system')} checked={theme === 'system'} />
                <FaDesktop className="text-2xl text-gray-500 mb-2" />
                <span className="text-xs font-medium text-gray-900 dark:text-white">System Auto</span>
                {theme === 'system' && <div className="absolute top-2 right-2 text-indigo-600 text-xs"><FaCheck /></div>}
              </label>
            </div>
          </div>
        </div>

        {/* Security Section: Change Password */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FaLock className="text-indigo-500" /> Account Security
            </h2>
          </div>
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Change Password</h3>
            <form onSubmit={handlePasswordChange} className="max-w-md space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={passwords.current}
                  onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">New Password (min 8 characters)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={passwords.new}
                  onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center disabled:opacity-70 shadow-xs"
                >
                  {isLoading ? <FaSpinner className="animate-spin mr-2 text-xs" /> : null}
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Danger Zone: Delete Account */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-200 dark:border-red-900/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
            <h2 className="text-base font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
              <FaExclamationTriangle /> Danger Zone
            </h2>
          </div>
          <div className="p-6">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
              Once you delete your account, there is no going back. All uploaded research papers, PDF files, summaries, chat conversations, and vector embeddings will be permanently wiped.
            </p>
            
            {!showDeleteConfirm ? (
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors"
              >
                Delete Account
              </button>
            ) : (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 max-w-lg">
                <p className="font-semibold text-red-800 dark:text-red-300 mb-2 text-sm">
                  Are you absolutely certain you want to delete your account?
                </p>
                <p className="text-xs text-red-700 dark:text-red-400 mb-4">
                  This action is irreversible and cascades to all database records and vector stores.
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium flex items-center disabled:opacity-70 shadow-xs"
                  >
                    {isDeleting ? <FaSpinner className="animate-spin mr-2 text-xs" /> : "Yes, permanently delete"}
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 rounded-lg text-xs font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;
