import React from 'react';
import { HiOutlineExclamationCircle } from 'react-icons/hi';
import Button from './Button';

const ErrorState = ({ message = 'Something went wrong', onRetry, className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/20 ${className}`}>
      <HiOutlineExclamationCircle className="h-10 w-10 text-red-500 dark:text-red-400 mb-3" />
      <h3 className="text-lg font-medium text-red-800 dark:text-red-300 mb-1">Error</h3>
      <p className="text-sm text-red-600 dark:text-red-400 max-w-md mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
