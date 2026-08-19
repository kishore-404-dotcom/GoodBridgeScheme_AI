import React, { createContext, useContext, useState } from 'react';
import { SUPPORTED_LANGUAGES, LanguageOption, getTranslation } from '../utils/vernacularDictionary';

interface LanguageContextType {
  currentLanguage: LanguageOption;
  setLanguageCode: (code: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: SUPPORTED_LANGUAGES[0],
  setLanguageCode: () => {},
  t: (key) => key
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageOption>(SUPPORTED_LANGUAGES[0]);

  const setLanguageCode = (code: string) => {
    const found = SUPPORTED_LANGUAGES.find((l) => l.code === code) || SUPPORTED_LANGUAGES[0];
    setCurrentLanguage(found);
  };

  const t = (key: string) => getTranslation(currentLanguage.code, key);

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguageCode, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
