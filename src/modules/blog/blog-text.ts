type T_LocalizedText = Record<string, unknown>;

const PREFERRED_LOCALES = ['en', 'vi'];

export function getBlogText(value: unknown, fallback = '') {
    if (typeof value === 'string')
        return value;
    if (typeof value === 'number')
        return String(value);
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return fallback;

    const localizedValue = value as T_LocalizedText;
    for (const locale of PREFERRED_LOCALES) {
        const text = localizedValue[locale];
        if (typeof text === 'string' && text.trim())
            return text;
    }

    const firstText = Object.values(localizedValue).find(text => typeof text === 'string' && text.trim());
    return typeof firstText === 'string' ? firstText : fallback;
}

export function getBlogFormText(value: unknown) {
    return getBlogText(value).trim();
}
