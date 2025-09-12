import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  description: string;
}

export interface KeyboardShortcutsHelpProps {
  shortcuts: KeyboardShortcut[];
  className?: string;
}

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  shortcuts,
  className = ''
}) => {
  const formatShortcut = (shortcut: KeyboardShortcut) => {
    const keys = [];
    if (shortcut.ctrlKey) keys.push('Ctrl');
    if (shortcut.shiftKey) keys.push('Shift');
    if (shortcut.altKey) keys.push('Alt');
    keys.push(shortcut.key.toUpperCase());
    return keys.join(' + ');
  };

  if (shortcuts.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Keyboard Shortcuts</CardTitle>
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