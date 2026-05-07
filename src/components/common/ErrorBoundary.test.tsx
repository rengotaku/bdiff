import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import i18n from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';
import { ErrorBoundary } from './ErrorBoundary';

const resources = {
  en: {
    translation: {
      errorBoundary: {
        title: 'Something went wrong',
        description:
          'We encountered an unexpected error. This has been logged and will be investigated.',
        errorDetails: 'Error Details (Development)',
        retry: 'Try Again',
        reload: 'Reload Page',
      },
    },
  },
  ja: {
    translation: {
      errorBoundary: {
        title: '問題が発生しました',
        description:
          '予期しないエラーが発生しました。このエラーは記録され、調査されます。',
        errorDetails: 'エラー詳細（開発用）',
        retry: '再試行',
        reload: 'ページを再読み込み',
      },
    },
  },
};

function setupI18n(lang: string) {
  i18n.use(initReactI18next).init({
    resources,
    lng: lang,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
  return i18n;
}

const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) throw new Error('Test error');
  return <div>Normal content</div>;
};

const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

beforeEach(() => {
  consoleError.mockClear();
});

describe('ErrorBoundary i18n', () => {
  it('エラーなし時は子要素をレンダリングする', () => {
    const i18nInstance = setupI18n('en');
    render(
      <I18nextProvider i18n={i18nInstance}>
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={false} />
        </ErrorBoundary>
      </I18nextProvider>
    );
    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('英語設定時に英語のエラーメッセージを表示する', () => {
    const i18nInstance = setupI18n('en');
    render(
      <I18nextProvider i18n={i18nInstance}>
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      </I18nextProvider>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(
      screen.getByText(
        'We encountered an unexpected error. This has been logged and will be investigated.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Reload Page')).toBeInTheDocument();
  });

  it('日本語設定時に日本語のエラーメッセージを表示する', () => {
    const i18nInstance = setupI18n('ja');
    render(
      <I18nextProvider i18n={i18nInstance}>
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      </I18nextProvider>
    );
    expect(screen.getByText('問題が発生しました')).toBeInTheDocument();
    expect(
      screen.getByText(
        '予期しないエラーが発生しました。このエラーは記録され、調査されます。'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('再試行')).toBeInTheDocument();
    expect(screen.getByText('ページを再読み込み')).toBeInTheDocument();
  });

  it('英語設定時にハードコードの英文が直接レンダリングされていないことを確認する', () => {
    const i18nInstance = setupI18n('ja');
    render(
      <I18nextProvider i18n={i18nInstance}>
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      </I18nextProvider>
    );
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
    expect(screen.queryByText('Reload Page')).not.toBeInTheDocument();
  });

  it('カスタムfallbackが指定されている場合はそれを表示する', () => {
    const i18nInstance = setupI18n('en');
    render(
      <I18nextProvider i18n={i18nInstance}>
        <ErrorBoundary fallback={<div>Custom fallback</div>}>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      </I18nextProvider>
    );
    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
  });

  it('再試行ボタンで子要素を再レンダリングできる', () => {
    let shouldThrowNow = true;
    const DynamicChild = () => {
      if (shouldThrowNow) throw new Error('Test error');
      return <div>Normal content</div>;
    };

    const i18nInstance = setupI18n('en');
    render(
      <I18nextProvider i18n={i18nInstance}>
        <ErrorBoundary>
          <DynamicChild />
        </ErrorBoundary>
      </I18nextProvider>
    );
    expect(screen.getByText('Try Again')).toBeInTheDocument();

    shouldThrowNow = false;
    fireEvent.click(screen.getByText('Try Again'));

    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });
});
