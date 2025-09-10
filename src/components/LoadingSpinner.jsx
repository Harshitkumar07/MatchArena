import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const LoadingSpinner = ({ size = 'md', fullScreen = false, message = 'Loading...' }) => {
  const { isDark } = useTheme();
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className={`${sizeClasses[size]} animate-spin`}>
        <svg className="w-full h-full" viewBox="0 0 24 24">
          <circle 
            className={`${isDark ? 'stroke-gray-700' : 'stroke-gray-200'}`}
            cx="12" 
            cy="12" 
            r="10" 
            strokeWidth="3" 
            fill="none"
          />
          <circle 
            className="stroke-blue-500" 
            cx="12" 
            cy="12" 
            r="10" 
            strokeWidth="3" 
            fill="none"
            strokeDasharray="31.4"
            strokeDashoffset="15.7"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {message && (
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className={`fixed inset-0 flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-white'} z-50`}>
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
