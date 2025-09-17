import React from 'react';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';

export interface DiffSettingsPanelProps {
  canCalculateDiff: boolean;
  isProcessing: boolean;
  isReading: boolean;
  onStartComparison: () => void;
}

export const DiffSettingsPanel: React.FC<DiffSettingsPanelProps> = ({
  canCalculateDiff,
  isProcessing,
  isReading,
  onStartComparison
}) => {
  return (
    <Button
      variant="primary"
      onClick={onStartComparison}
      disabled={!canCalculateDiff || isReading || isProcessing}
      size="lg"
      className="w-40 bg-primary hover:bg-primary-hover text-white"
    >
      {isProcessing ? (
        <>
          <LoadingSpinner size="sm" />
          Comparing...
        </>
      ) : (
        'Compare Files'
      )}
    </Button>
  );
};