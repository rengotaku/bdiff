import React from 'react';
import { useTranslation } from 'react-i18next';

export interface NoDifferencesDisplayProps {
  className?: string;
}

export const NoDifferencesDisplay: React.FC<NoDifferencesDisplayProps> = ({
  className = ''
}) => {
  const { t } = useTranslation();

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
            {t('diffViewer.noDifferences.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-md mx-auto leading-relaxed">
            {t('diffViewer.noDifferences.message')}<br />
            {t('diffViewer.noDifferences.noChangesDetected')}
          </p>
        </div>

        {/* Sub information */}
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>{t('diffViewer.noDifferences.fullMatch')}</span>
          </div>
          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
            <span>{t('diffViewer.noDifferences.noChanges')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};