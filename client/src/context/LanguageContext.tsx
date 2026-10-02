import React, { createContext, useContext, useState } from 'react';
import { SUPPORTED_LANGUAGES, LanguageOption, getTranslation } from '../utils/vernacularDictionary';
import { readStore, writeStore } from '../utils/storage';

interface LanguageContextType {
  currentLanguage: LanguageOption;
  setLanguageCode: (code: string) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: SUPPORTED_LANGUAGES[0],
  setLanguageCode: () => {},
  t: (key) => key
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageOption>(
    () => SUPPORTED_LANGUAGES.find((l) => l.code === readStore('language', 'en')) || SUPPORTED_LANGUAGES[0]
  );

  const setLanguageCode = (code: string) => {
    const found = SUPPORTED_LANGUAGES.find((l) => l.code === code) || SUPPORTED_LANGUAGES[0];
    setCurrentLanguage(found);
    writeStore('language', found.code);
  };

  const t = (key: string, vars?: Record<string, string | number>) => getTranslation(currentLanguage.code, key, vars);

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguageCode, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
