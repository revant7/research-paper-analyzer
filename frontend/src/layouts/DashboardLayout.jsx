import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  HiOutlineHome, HiOutlineDocumentText, HiOutlineCloudUpload,
  HiOutlineSearch, HiOutlineChatAlt2, HiOutlineClock,
  HiOutlineUser, HiOutlineCog, HiMenu, HiX, HiMoon, HiSun, HiLogout
} from 'react-icons/hi';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: HiOutlineHome },
  { name: 'My Papers', path: '/papers', icon: HiOutlineDocumentText },
  { name: 'Upload Paper', path: '/upload', icon: HiOutlineCloudUpload },
  { name: 'Semantic Search', path: '/search', icon: HiOutlineSearch },
  { name: 'AI Chat', path: '/chat', icon: HiOutlineChatAlt2 },
  { name: 'History', path: '/history', icon: HiOutlineClock },
  { name: 'Profile', path: '/profile', icon: HiOutlineUser },
  { name: 'Settings', path: '/settings', icon: HiOutlineCog },
];

const DashboardLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:block flex flex-col ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-700">
          <span className="text-xl font-bold text-primary-600 dark:text-primary-400">ResearchRAG</span>
          <button className="lg:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" onClick={() => setMobileMenuOpen(false)}>
            <HiX className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/50'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <button onClick={handleLogout} className="flex items-center w-full px-3 py-2 text-sm font-medium text-slate-700 rounded-md hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/50 transition-colors">
            <HiLogout className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between h-16 px-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shrink-0 transition-colors duration-200">
          <div className="flex items-center">
            <button className="lg:hidden mr-4 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" onClick={() => setMobileMenuOpen(true)}>
              <HiMenu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white capitalize">
              {window.location.pathname.split('/')[1] || 'Dashboard'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button onClick={toggleTheme} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors">
              {theme === 'dark' ? <HiSun className="w-5 h-5" /> : <HiMoon className="w-5 h-5" />}
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-300">{user?.name || 'User'}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
