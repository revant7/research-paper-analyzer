import React from 'react';

const Badge = ({
  children,
  color = 'gray',
  size = 'md',
  dot = false,
  className = ''
}) => {
  const colors = {
    gray: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
    red: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    green: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
  };

  const dotColors = {
    gray: 'bg-slate-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    indigo: 'bg-indigo-500',
    purple: 'bg-purple-500',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base'
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${colors[color]} ${sizes[size]} ${className}`}>
      {dot && (
        <svg className={`mr-1.5 h-2 w-2 rounded-full ${dotColors[color]}`} fill="currentColor" viewBox="0 0 8 8">
          <circle cx="4" cy="4" r="3" />
        </svg>
      )}
      {children}
    </span>
  );
};

export default Badge;
