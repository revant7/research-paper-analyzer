import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const SplitLayout = ({ leftPanel, rightPanel, defaultLeftWidth = 50 }) => {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || isMobile || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidthPercent = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // Constrain between 20% and 80%
    if (newWidthPercent > 20 && newWidthPercent < 80) {
      setLeftWidth(newWidthPercent);
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, isMobile]);

  if (isMobile) {
    return (
      <div className="flex flex-col h-full w-full">
        <div className="flex-1 min-h-[50vh] border-b border-gray-200 dark:border-gray-700">
          {leftPanel}
        </div>
        <div className="flex-1 min-h-[50vh]">
          {rightPanel}
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="flex h-full w-full overflow-hidden"
    >
      <div style={{ width: `${leftWidth}%` }} className="h-full">
        {leftPanel}
      </div>
      
      <div 
        className="w-1.5 bg-gray-200 dark:bg-gray-800 hover:bg-indigo-400 dark:hover:bg-indigo-500 cursor-col-resize flex-shrink-0 transition-colors z-10"
        onMouseDown={handleMouseDown}
      >
        <div className="h-full w-full flex items-center justify-center">
          <div className="h-8 w-0.5 bg-gray-400 dark:bg-gray-600 rounded"></div>
        </div>
      </div>
      
      <div style={{ width: `${100 - leftWidth}%` }} className="h-full">
        {rightPanel}
      </div>
    </div>
  );
};

SplitLayout.propTypes = {
  leftPanel: PropTypes.node.isRequired,
  rightPanel: PropTypes.node.isRequired,
  defaultLeftWidth: PropTypes.number,
};

export default SplitLayout;
