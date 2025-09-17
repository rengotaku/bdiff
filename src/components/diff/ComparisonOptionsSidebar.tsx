import React, { useState } from 'react';
import ComparisonOptions from './ComparisonOptions';
import type { ComparisonOptions as ComparisonOptionsType } from '../../types/types';

interface ComparisonOptionsSidebarProps {
  options: ComparisonOptionsType;
  onChange: (options: ComparisonOptionsType) => void;
  disabled?: boolean;
}

export const ComparisonOptionsSidebar: React.FC<ComparisonOptionsSidebarProps> = ({
  options,
  onChange,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Toggle Button */}
      <div className="fixed right-0 top-1/2 transform -translate-y-1/2 z-50">
        <button
          onClick={toggleSidebar}
          className="bg-white shadow-lg border border-gray-200 p-4 rounded-l-lg hover:bg-gray-50 transition-colors duration-200 group"
          aria-label={isOpen ? "Close comparison options" : "Open comparison options"}
        >
          <svg
            className={`w-6 h-6 text-gray-light transform transition-transform duration-200 ${
              isOpen ? 'rotate-180' : 'rotate-0'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 z-40"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full w-80 bg-white shadow-lg border-l border-gray-200 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-dark">Comparison Options</h3>
            <button
              onClick={toggleSidebar}
              className="p-1 rounded hover:bg-gray-200 transition-colors"
              aria-label="Close sidebar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            <ComparisonOptions
              options={options}
              onChange={onChange}
              disabled={disabled}
            />
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-light">
              These options control how files are compared. Changes take effect immediately.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ComparisonOptionsSidebar;