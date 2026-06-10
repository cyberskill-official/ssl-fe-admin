/**
 * Extract a displayable string from a multilingual title field.
 * When the admin portal requests blog data, titles are returned as raw
 * multilingual objects (e.g. { en: "...", de: "..." }). This helper
 * picks the English fallback, then the first available value, and
 * ultimately returns an empty string so React never receives an object
 * as a child.
 */
export function getTitleString(title: unknown): string {
    if (typeof title === "string") return title;
    if (title && typeof title === "object") {
        const obj = title as Record<string, string>;
        const keys = Object.keys(obj);
        if (keys.length === 0) return "";
        return obj["en"] || obj[keys[0]] || "";
    }
    return "";
}
