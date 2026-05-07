import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { type KeyboardShortcut, formatShortcut } from '../../hooks/useKeyboardShortcuts';

type DisplayShortcut = Omit<KeyboardShortcut, 'action' | 'preventDefault'>;

export interface KeyboardShortcutsHelpProps {
  shortcuts: DisplayShortcut[];
  className?: string;
}

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  shortcuts,
  className = ''
}) => {
  const { t } = useTranslation();

  if (shortcuts.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{t('keyboard.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{shortcut.description}</span>
              <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                {formatShortcut(shortcut)}
              </code>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
