import React from 'react';

const ProgressBar = ({
  progress = 0,
  color = 'primary',
  showLabel = false,
  label,
  className = '',
  height = 'md'
}) => {
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);
  
  const colors = {
    primary: 'bg-primary-600 dark:bg-primary-500',
    green: 'bg-green-600 dark:bg-green-500',
    blue: 'bg-blue-600 dark:bg-blue-500',
    red: 'bg-red-600 dark:bg-red-500',
  };

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  };

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex justify-between mb-1 text-sm font-medium">
          <span className="text-slate-700 dark:text-slate-300">{label}</span>
          {showLabel && <span className="text-slate-700 dark:text-slate-300">{normalizedProgress}%</span>}
        </div>
      )}
      <div className={`w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden ${heights[height]}`}>
        <div
          className={`${heights[height]} ${colors[color]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${normalizedProgress}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
