import React, { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  icon,
  type = 'text',
  fullWidth = true,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
  const inputStyles = [
    'block rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900',
    'text-slate-900 dark:text-slate-100 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm transition-colors',
    'disabled:bg-slate-100 disabled:cursor-not-allowed dark:disabled:bg-slate-800',
    fullWidth ? 'w-full' : '',
    icon ? 'pl-10' : 'pl-3',
    'pr-3 py-2',
    error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '',
    className
  ].join(' ');

  return (
    <div className={`${fullWidth ? 'w-full' : ''} mb-4`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {label}
        </label>
      )}
      <div className="relative rounded-md shadow-sm">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            {icon}
          </div>
        )}
        <input
          type={type}
          id={inputId}
          ref={ref}
          className={inputStyles}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
