import React from 'react';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';

export interface DiffSettingsPanelProps {
  canCalculateDiff: boolean;
  isProcessing: boolean;
  isReading: boolean;
  onStartComparison: () => void;
  onClear: () => void;
}

export const DiffSettingsPanel: React.FC<DiffSettingsPanelProps> = ({
  canCalculateDiff,
  isProcessing,
  isReading,
  onStartComparison,
  onClear
}) => {
  return (
    <div className="flex items-center gap-3">
      <Button
        variant="secondary"
        onClick={onClear}
        disabled={isReading || isProcessing}
        size="sm"
      >
        Clear All
      </Button>
      <Button
        variant="primary"
        onClick={onStartComparison}
        disabled={!canCalculateDiff || isReading || isProcessing}
        size="sm"
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
    </div>
  );
};