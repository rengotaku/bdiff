import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

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
          {t('comparison.comparing')}
        </>
      ) : (
        t('comparison.compareButton')
      )}
    </Button>
  );
};