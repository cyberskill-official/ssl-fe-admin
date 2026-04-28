import { initI18next } from '@cyberskill/shared/react/i18next';

import translationEn from './data/en.json';
import translationVi from './data/vi.json';

export function initI18n() {
    // Convert flat JSON structure to namespace structure
    const enNamespaces: Record<string, any> = {};
    const viNamespaces: Record<string, any> = {};

    // Extract each top-level key as a separate namespace
    Object.keys(translationEn).forEach((key) => {
        enNamespaces[key] = (translationEn as any)[key];
    });

    Object.keys(translationVi).forEach((key) => {
        viNamespaces[key] = (translationVi as any)[key];
    });

    initI18next({
        lng: 'en',
        fallbackLng: 'en',
        supportedLngs: ['en', 'vi'],
        nonExplicitSupportedLngs: true,
        load: 'languageOnly',
        defaultNS: 'translation',
        fallbackNS: 'translation',
        resources: {
            en: {
                translation: translationEn,
                ...enNamespaces,
            },
            vi: {
                translation: translationVi,
                ...viNamespaces,
            },
        },
    });
}
