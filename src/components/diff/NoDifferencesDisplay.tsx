import React from 'react';

export interface NoDifferencesDisplayProps {
  className?: string;
}

export const NoDifferencesDisplay: React.FC<NoDifferencesDisplayProps> = ({ 
  className = '' 
}) => {
  return (
    <div className={`text-center py-16 ${className}`}>
      <div className="space-y-6">
        {/* Main icon */}
        <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
          <svg 
            className="w-12 h-12 text-green-600" 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Main message */}
        <div className="space-y-3">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
            No Differences
          </h2>
          <p className="text-xl text-gray-600 max-w-md mx-auto leading-relaxed">
            The files are identical.<br />
            No changes were detected.
          </p>
        </div>

        {/* Sub information */}
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>100% Match</span>
          </div>
          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
            <span>No Changes</span>
          </div>
        </div>
      </div>
    </div>
  );
};