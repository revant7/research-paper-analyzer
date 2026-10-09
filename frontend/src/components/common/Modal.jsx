import React, { useEffect } from 'react';
import { HiX } from 'react-icons/hi';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnEsc = true,
  closeOnBackdrop = true
}) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && closeOnEsc) onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, closeOnEsc]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl'
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && closeOnBackdrop) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={handleBackdropClick}>
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-slate-900/75 transition-opacity" aria-hidden="true" onClick={handleBackdropClick} />
        
        <div className={`relative inline-block w-full transform rounded-lg bg-white dark:bg-slate-800 text-left align-bottom shadow-xl transition-all sm:my-8 sm:align-middle ${sizes[size]} opacity-100 scale-100`}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            {title && (
              <h3 className="text-lg font-medium leading-6 text-slate-900 dark:text-white">
                {title}
              </h3>
            )}
            <button
              onClick={onClose}
              className="rounded-md text-slate-400 hover:text-slate-500 focus:outline-none dark:hover:text-slate-300"
            >
              <HiX className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          
          <div className="px-6 py-4 text-slate-600 dark:text-slate-300">
            {children}
          </div>
          
          {footer && (
            <div className="bg-slate-50 dark:bg-slate-700/50 px-6 py-4 rounded-b-lg border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
