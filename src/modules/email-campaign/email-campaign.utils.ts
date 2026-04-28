const HEADING_TAG_RE = /^h[1-6]$/;
const AMP_RE = /&/g;
const LT_RE = /</g;
const GT_RE = />/g;
const QUOT_RE = /"/g;
const APOS_RE = /'/g;
const SCRIPT_RE = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const EVENT_HANDLER_RE = /\s*on\w+\s*=["'][^"']*["']/gi;
const JAVASCRIPT_PROTO_RE = /javascript:/gi;
const DATA_URL_RE = /\bdata:(?!image\/)/gi;
const OPEN_TAG_RE = /<([a-z][a-z0-9]*)\b[^>]*(?<!\/)>/gi;
const OPEN_TAG_NAME_RE = /<([a-z][a-z0-9]*)/i;
const CLOSE_TAG_RE = /<\/([a-z][a-z0-9]*)\b[^>]*>/gi;
const CLOSE_TAG_NAME_RE = /<\/([a-z][a-z0-9]*)/i;
const SANITIZE_TAG_RE = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
const SCRIPT_PATTERN_RE = /<script/i;
const JAVASCRIPT_PATTERN_RE = /javascript:/i;
const ONLOAD_RE = /onload=/i;
const ONERROR_RE = /onerror=/i;
const ONCLICK_RE = /onclick=/i;
const DATA_PATTERN_RE = /data:(?!image\/)/i;
const HTML_TAG_RE = /<[^>]*>/g;
const AMP_ENTITY_RE = /&amp;/g;
const LT_ENTITY_RE = /&lt;/g;
const GT_ENTITY_RE = /&gt;/g;
const QUOT_ENTITY_RE = /&quot;/g;
const APOS_ENTITY_RE = /&#x27;/g;
const NBSP_ENTITY_RE = /&nbsp;/g;
const WHITESPACE_RE = /\s+/g;

interface I_LexicalNode {
    type: string;
    text?: string;
    format?: number;
    children?: I_LexicalNode[];
    tag?: string;
    listType?: 'number' | 'bullet';
}

interface I_LexicalRoot {
    root: {
        children: I_LexicalNode[];
    };
}

const LEXICAL_FORMAT = {
    BOLD: 1,
    ITALIC: 2,
    STRIKETHROUGH: 4,
    UNDERLINE: 8,
    CODE: 16,
    SUBSCRIPT: 32,
    SUPERSCRIPT: 64,
} as const;

const MAX_RECURSION_DEPTH = 100;

export function convertLexicalJsonToText(lexicalJson: string): string {
    if (!lexicalJson || lexicalJson.trim() === '') {
        return '';
    }

    try {
        const parsedJson: I_LexicalRoot = JSON.parse(lexicalJson);

        if (parsedJson?.root?.children && Array.isArray(parsedJson.root.children)) {
            return extractTextFromLexicalNodes(parsedJson.root.children, 0);
        }

        return basicHtmlSanitize(lexicalJson);
    }
    catch (error) {
        console.error('Failed to parse Lexical JSON:', error);
        return basicHtmlSanitize(lexicalJson);
    }
}

function extractTextFromLexicalNodes(
    nodes: I_LexicalNode[],
    depth = 0,
): string {
    if (depth > MAX_RECURSION_DEPTH) {
        console.warn('Maximum recursion depth reached in Lexical parsing');
        return '';
    }

    if (!Array.isArray(nodes)) {
        return '';
    }

    const result: string[] = [];

    for (const node of nodes) {
        if (!node || typeof node !== 'object')
            continue;

        switch (node.type) {
            case 'paragraph': {
                if (node.children && node.children.length > 0) {
                    const paragraphText = extractTextFromLexicalNodes(
                        node.children,
                        depth + 1,
                    );
                    if (paragraphText.trim()) {
                        result.push(`<p>${paragraphText}</p>`);
                    }
                    else {
                        result.push('<p><br></p>');
                    }
                }
                else {
                    result.push('<p><br></p>');
                }
                break;
            }

            case 'text': {
                let text = escapeHtml(node.text || '');

                if (node.format) {
                    if (node.format & LEXICAL_FORMAT.BOLD) {
                        text = `<strong>${text}</strong>`;
                    }
                    if (node.format & LEXICAL_FORMAT.ITALIC) {
                        text = `<em>${text}</em>`;
                    }
                    if (node.format & LEXICAL_FORMAT.UNDERLINE) {
                        text = `<u>${text}</u>`;
                    }
                    if (node.format & LEXICAL_FORMAT.STRIKETHROUGH) {
                        text = `<del>${text}</del>`;
                    }
                    if (node.format & LEXICAL_FORMAT.CODE) {
                        text = `<code>${text}</code>`;
                    }
                }

                result.push(text);
                break;
            }

            case 'heading': {
                const level = node.tag || 'h1';
                const headingText = node.children
                    ? extractTextFromLexicalNodes(node.children, depth + 1)
                    : '';
                if (HEADING_TAG_RE.test(level)) {
                    result.push(`<${level}>${headingText}</${level}>`);
                }
                else {
                    result.push(`<h1>${headingText}</h1>`);
                }
                break;
            }

            case 'list': {
                const listTag = node.listType === 'number' ? 'ol' : 'ul';
                const listItems = node.children
                    ? extractTextFromLexicalNodes(node.children, depth + 1)
                    : '';
                result.push(`<${listTag}>${listItems}</${listTag}>`);
                break;
            }

            case 'listitem': {
                const itemText = node.children
                    ? extractTextFromLexicalNodes(node.children, depth + 1)
                    : '';
                result.push(`<li>${itemText}</li>`);
                break;
            }

            case 'quote': {
                const quoteText = node.children
                    ? extractTextFromLexicalNodes(node.children, depth + 1)
                    : '';
                result.push(`<blockquote>${quoteText}</blockquote>`);
                break;
            }

            case 'linebreak':
                result.push('<br>');
                break;

            default:
                if (node.children && Array.isArray(node.children)) {
                    result.push(extractTextFromLexicalNodes(node.children, depth + 1));
                }
                else if (node.text && typeof node.text === 'string') {
                    result.push(escapeHtml(node.text));
                }
                break;
        }
    }

    return result.join('');
}

export function isLexicalJson(content: string): boolean {
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return false;
    }

    try {
        const parsed = JSON.parse(content);

        return (
            parsed
            && typeof parsed === 'object'
            && parsed.root
            && typeof parsed.root === 'object'
            && parsed.root.children
            && Array.isArray(parsed.root.children)
            && (parsed.root.children.length === 0
                || parsed.root.children.some(
                    (child: any) =>
                        child && typeof child === 'object' && typeof child.type === 'string',
                ))
        );
    }
    catch {
        return false;
    }
}

export function processEmailContent(content: string): string {
    if (!content || typeof content !== 'string') {
        return '';
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) {
        return '';
    }

    try {
        if (isLexicalJson(trimmedContent)) {
            return convertLexicalJsonToText(trimmedContent);
        }

        return sanitizeEmailHtml(trimmedContent);
    }
    catch (error) {
        console.error('Error processing email content:', error);
        return basicHtmlSanitize(trimmedContent);
    }
}

function escapeHtml(text: string): string {
    if (!text)
        return '';

    return text
        .replace(AMP_RE, '&amp;')
        .replace(LT_RE, '&lt;')
        .replace(GT_RE, '&gt;')
        .replace(QUOT_RE, '&quot;')
        .replace(APOS_RE, '&#x27;');
}

function sanitizeEmailHtml(html: string): string {
    if (!html)
        return '';

    html = html.replace(SCRIPT_RE, '');

    html = html.replace(EVENT_HANDLER_RE, '');

    html = html.replace(JAVASCRIPT_PROTO_RE, '');

    html = html.replace(DATA_URL_RE, '');

    const allowedTags = [
        'p',
        'br',
        'strong',
        'b',
        'em',
        'i',
        'u',
        'del',
        'code',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'ul',
        'ol',
        'li',
        'blockquote',
        'a',
        'img',
        'div',
        'span',
        'table',
        'thead',
        'tbody',
        'tr',
        'td',
        'th',
    ];

    html = html.replace(SANITIZE_TAG_RE, (match, tagName) => {
        const tag = tagName.toLowerCase();
        if (!allowedTags.includes(tag)) {
            return '';
        }
        return match;
    });

    return html;
}

function basicHtmlSanitize(content: string): string {
    if (!content)
        return '';

    return content
        .replace(SCRIPT_RE, '')
        .replace(JAVASCRIPT_PROTO_RE, '')
        .replace(EVENT_HANDLER_RE, '');
}

export function validateEmailHtml(htmlContent: string): {
    isValid: boolean;
    issues: string[];
} {
    const issues: string[] = [];

    if (!htmlContent || htmlContent.trim().length === 0) {
        issues.push('Content is empty');
        return { isValid: false, issues };
    }

    const selfClosingTags = [
        'br',
        'img',
        'hr',
        'input',
        'area',
        'base',
        'col',
        'embed',
        'link',
        'meta',
        'source',
        'track',
        'wbr',
    ];
    const openTags = (
        htmlContent.match(OPEN_TAG_RE) || []
    )
        .map(tag => tag.match(OPEN_TAG_NAME_RE)?.[1]?.toLowerCase())
        .filter(tag => tag && !selfClosingTags.includes(tag));

    const closeTags = (htmlContent.match(CLOSE_TAG_RE) || [])
        .map(tag => tag.match(CLOSE_TAG_NAME_RE)?.[1]?.toLowerCase())
        .filter(tag => tag);

    const tagCounts: Record<string, number> = {};
    openTags.forEach((tag) => {
        if (tag)
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
    closeTags.forEach((tag) => {
        if (tag)
            tagCounts[tag] = (tagCounts[tag] || 0) - 1;
    });

    const unbalancedTags = Object.entries(tagCounts).filter(
        ([, count]) => count !== 0,
    );
    if (unbalancedTags.length > 0) {
        issues.push(
            `Potential unclosed HTML tags detected: ${unbalancedTags
                .map(([tag]) => tag)
                .join(', ')}`,
        );
    }

    const suspiciousPatterns = [
        { pattern: SCRIPT_PATTERN_RE, message: 'Script tags are not allowed' },
        { pattern: JAVASCRIPT_PATTERN_RE, message: 'JavaScript protocol is not allowed' },
        { pattern: ONLOAD_RE, message: 'Event handlers are not allowed' },
        { pattern: ONERROR_RE, message: 'Event handlers are not allowed' },
        { pattern: ONCLICK_RE, message: 'Event handlers are not allowed' },
        {
            pattern: DATA_PATTERN_RE,
            message: 'Data URLs (except images) are not allowed',
        },
    ];

    for (const { pattern, message } of suspiciousPatterns) {
        if (pattern.test(htmlContent)) {
            issues.push(message);
        }
    }

    return {
        isValid: issues.length === 0,
        issues,
    };
}

export function extractPlainTextFromHtml(htmlContent: string): string {
    if (!htmlContent)
        return '';

    return htmlContent
        .replace(HTML_TAG_RE, '')
        .replace(AMP_ENTITY_RE, '&')
        .replace(LT_ENTITY_RE, '<')
        .replace(GT_ENTITY_RE, '>')
        .replace(QUOT_ENTITY_RE, '"')
        .replace(APOS_ENTITY_RE, '\'')
        .replace(NBSP_ENTITY_RE, ' ')
        .replace(WHITESPACE_RE, ' ')
        .trim();
}

export function getEmailPreview(content: string, maxLength = 150): string {
    if (!content)
        return '';

    const htmlContent = processEmailContent(content);

    const plainText = extractPlainTextFromHtml(htmlContent);

    if (plainText.length <= maxLength) {
        return plainText;
    }

    return `${plainText.substring(0, maxLength).trim()}...`;
}

export function formatDateForEmail(date: Date | string | undefined): string {
    if (!date)
        return '';

    try {
        const dateObj = date instanceof Date ? date : new Date(date);
        if (Number.isNaN(dateObj.getTime()))
            return '';
        return dateObj.toLocaleDateString();
    }
    catch {
        return '';
    }
}

export function extractTimeFromDate(date: Date | string | undefined): string {
    if (!date)
        return '';

    try {
        const dateObj = date instanceof Date ? date : new Date(date);
        if (Number.isNaN(dateObj.getTime()))
            return '';
        return `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj
            .getMinutes()
            .toString()
            .padStart(2, '0')}`;
    }
    catch {
        return '';
    }
}

export function formatDateForInput(date: Date | string | undefined): string {
    if (!date)
        return '';

    try {
        const dateObj = date instanceof Date ? date : new Date(date);
        if (Number.isNaN(dateObj.getTime()))
            return '';
        const isoString = dateObj.toISOString();
        const parts = isoString.split('T');
        return parts[0] || '';
    }
    catch {
        return '';
    }
}

export { basicHtmlSanitize, escapeHtml, sanitizeEmailHtml };
