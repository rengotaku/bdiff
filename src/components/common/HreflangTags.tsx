import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const supportedLanguages = [
  { code: 'ja', hreflang: 'ja' },
  { code: 'en', hreflang: 'en' },
  { code: 'ko', hreflang: 'ko' },
  { code: 'zh-TW', hreflang: 'zh-Hant' },
  { code: 'zh-CN', hreflang: 'zh-Hans' },
  { code: 'id', hreflang: 'id' },
  { code: 'fr', hreflang: 'fr' },
  { code: 'de', hreflang: 'de' },
];

/**
 * Component that manages hreflang tags in the document head
 * for SEO and language variant indication
 */
export function HreflangTags() {
  const location = useLocation();

  useEffect(() => {
    // Remove existing hreflang tags
    const existingTags = document.querySelectorAll('link[rel="alternate"][hreflang]');
    existingTags.forEach((tag) => tag.remove());

    // Extract the path without the language prefix
    const pathParts = location.pathname.split('/').filter(Boolean);
    const currentPath = pathParts.length > 1 ? pathParts.slice(1).join('/') : '';

    // Get the base URL
    const baseUrl = `${window.location.protocol}//${window.location.host}`;

    // Add hreflang tags for all supported languages
    supportedLanguages.forEach(({ code, hreflang }) => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = hreflang;
      link.href = currentPath ? `${baseUrl}/${code}/${currentPath}` : `${baseUrl}/${code}/`;
      document.head.appendChild(link);
    });

    // Add x-default hreflang (pointing to Japanese as default)
    const defaultLink = document.createElement('link');
    defaultLink.rel = 'alternate';
    defaultLink.hreflang = 'x-default';
    defaultLink.href = currentPath ? `${baseUrl}/ja/${currentPath}` : `${baseUrl}/ja/`;
    document.head.appendChild(defaultLink);
  }, [location.pathname]);

  return null;
}
