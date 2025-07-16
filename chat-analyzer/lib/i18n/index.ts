import { tr } from './locales/tr';
import { en } from './locales/en';

export type Language = 'tr' | 'en';

export const locales = {
  tr,
  en
};

export const defaultLanguage: Language = 'tr';

export type LocaleType = typeof tr;
