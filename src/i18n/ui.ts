/**
 * Minimal i18n module supporting pt (default) and en locales.
 */
export const defaultLang = 'pt';

export const ui = {
  pt: {
    'nav.home': 'Início',
    'nav.feed': 'Feed',
    'nav.projects': 'Projetos',
    'nav.docs': 'Docs',
    'footer.rights': 'Todos os direitos reservados.',
  },
  en: {
    'nav.home': 'Home',
    'nav.feed': 'Feed',
    'nav.projects': 'Projects',
    'nav.docs': 'Docs',
    'footer.rights': 'All rights reserved.',
  },
} as const;

export type Lang = keyof typeof ui;
export type UiKey = keyof typeof ui.pt;

/**
 * Extracts language ('pt' or 'en') from pathname.
 */
export function getLangFromUrl(url: URL): Lang {
  const [, lang] = url.pathname.split('/');
  return lang === 'en' ? 'en' : 'pt';
}

/**
 * Helper returning translation function.
 */
export function useTranslations(lang: Lang) {
  return (key: UiKey) => ui[lang][key] || ui.pt[key];
}
