import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { cn } from '../../utils/cn';

export interface LanguageSwitcherProps {
  className?: string;
  variant?: 'dropdown' | 'buttons';
}

const languages = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
] as const;

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className,
  variant = 'dropdown',
}) => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  if (variant === 'buttons') {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        {languages.map((lang) => (
          <Button
            key={lang.code}
            variant={i18n.language === lang.code ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => handleLanguageChange(lang.code)}
            className="min-w-[60px]"
          >
            <span className="mr-1">{lang.flag}</span>
            {lang.code.toUpperCase()}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
        aria-label={t('header.languageSelector')}
      >
        <span>{currentLanguage.flag}</span>
        <span className="text-sm font-medium">{currentLanguage.label}</span>
        <svg
          className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-40 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                className={cn(
                  'flex w-full items-center px-4 py-2 text-sm transition-colors',
                  i18n.language === lang.code
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
                onClick={() => handleLanguageChange(lang.code)}
              >
                <span className="mr-3">{lang.flag}</span>
                {lang.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
