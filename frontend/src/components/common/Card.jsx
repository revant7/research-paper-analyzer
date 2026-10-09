import React from 'react';

const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  hover = false,
  className = '',
  header,
  footer,
  ...props
}) => {
  const baseStyles = 'bg-white dark:bg-slate-800 rounded-lg overflow-hidden transition-all duration-200';
  
  const variants = {
    default: 'shadow-sm border border-slate-200 dark:border-slate-700',
    bordered: 'border-2 border-slate-200 dark:border-slate-700',
    elevated: 'shadow-lg border border-slate-100 dark:border-slate-700'
  };
  
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-8'
  };

  const classes = [
    baseStyles,
    variants[variant],
    hover ? 'hover:shadow-md hover:-translate-y-1' : '',
    className
  ].join(' ');

  return (
    <div className={classes} {...props}>
      {header && (
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          {header}
        </div>
      )}
      <div className={paddings[padding]}>
        {children}
      </div>
      {footer && (
        <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
