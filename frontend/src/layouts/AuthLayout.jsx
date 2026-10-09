import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { HiSun, HiMoon } from 'react-icons/hi';

const AuthLayout = () => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 to-accent-50 dark:from-slate-900 dark:to-slate-800 transition-colors duration-200 relative">
      <div className="absolute top-4 right-4">
        <button onClick={toggleTheme} className="p-2 rounded-full text-slate-600 hover:bg-white/50 dark:text-slate-300 dark:hover:bg-slate-700/50 transition-colors">
          {theme === 'dark' ? <HiSun className="w-6 h-6" /> : <HiMoon className="w-6 h-6" />}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white">
          ResearchRAG
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          AI-Powered Research Paper Assistant
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-100 dark:border-slate-700">
          <Outlet />

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300 dark:border-slate-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  {isLogin ? 'New to ResearchRAG?' : 'Already have an account?'}
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                to={isLogin ? '/register' : '/login'}
                className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
              >
                {isLogin ? 'Create an account' : 'Sign in instead'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
