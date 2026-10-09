import React from 'react';

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className = ''
}) => {
  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      {Icon && (
        <div className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500 mb-4">
          <Icon className="h-full w-full" />
        </div>
      )}
      <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
        {description}
      </p>
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
