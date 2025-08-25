import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';

i18n
  .use(HttpApi) // loads translations from your server
  .use(initReactI18next) // pass the i18n instance to react-i18next.
  .init({
    supportedLngs: ['en', 'de'], // add languages you want to support
    fallbackLng: 'en',
    debug: true,
    detection: {
      order: ['queryString', 'cookie', 'localStorage', 'sessionStorage', 'navigator', 'htmlTag'],
      caches: ['cookie'],
    },
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    react: {
      useSuspense: false, // this is important for non-blocking rendering
    },
  });

export default i18n;
