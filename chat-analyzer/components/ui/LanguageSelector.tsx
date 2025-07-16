'use client';

import React from 'react';
import { useI18n } from '@/lib/i18n/I18nProvider';

const LanguageSelector: React.FC = () => {
  const { locale, language, changeLanguage } = useI18n();

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-700">
        {locale.language}:
      </span>
      <div className="flex border rounded-md overflow-hidden">
        <button
          onClick={() => changeLanguage('tr')}
          className={`px-3 py-1 text-sm font-medium transition-colors ${
            language === 'tr'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          TR
        </button>
        <button
          onClick={() => changeLanguage('en')}
          className={`px-3 py-1 text-sm font-medium transition-colors ${
            language === 'en'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          EN
        </button>
      </div>
    </div>
  );
};

export default LanguageSelector;
