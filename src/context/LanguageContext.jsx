import { createContext, useContext, useEffect, useState } from 'react';
import en from '@/translations/en.json';
import km from '@/translations/km.json';

const resources = { en, km };
const STORAGE_KEY = 'app-language';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    if (typeof window === 'undefined') return 'en';
    return localStorage.getItem(STORAGE_KEY) || 'en';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const locale = language === 'km' ? 'km-KH' : 'en-US';

  const t = (key, vars = {}) => {
    const keys = key.split('.');
    let value = resources[language];
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }
    if (typeof value !== 'string') return key;
    return value.replace(/\{\{(\w+)\}\}/g, (_, name) => vars[name] ?? `{{${name}}}`);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, locale }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
