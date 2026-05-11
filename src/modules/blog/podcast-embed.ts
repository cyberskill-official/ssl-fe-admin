const HTML_TAG_RE = /<[^>]+>/u;
const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be']);
const VIMEO_HOSTS = new Set(['vimeo.com', 'www.vimeo.com', 'player.vimeo.com']);
const SPOTIFY_HOSTS = new Set(['open.spotify.com']);
const APPLE_HOSTS = new Set(['podcasts.apple.com', 'embed.podcasts.apple.com']);
const BUNNY_HOSTS = new Set(['iframe.mediadelivery.net']);

function getYoutubeEmbedUrl(url: URL): string | undefined {
    if (url.hostname === 'youtu.be') {
        const videoId = url.pathname.split('/').filter(Boolean)[0];
        return videoId ? `https://www.youtube.com/embed/${videoId}` : undefined;
    }

    if (url.pathname.startsWith('/embed/')) {
        return `https://www.youtube.com${url.pathname}`;
    }

    if (url.pathname.startsWith('/shorts/')) {
        const videoId = url.pathname.split('/').filter(Boolean)[1];
        return videoId ? `https://www.youtube.com/embed/${videoId}` : undefined;
    }

    const videoId = url.searchParams.get('v');
    return videoId ? `https://www.youtube.com/embed/${videoId}` : undefined;
}

function getVimeoEmbedUrl(url: URL): string | undefined {
    if (url.hostname === 'player.vimeo.com' && url.pathname.startsWith('/video/')) {
        return `https://player.vimeo.com${url.pathname}`;
    }

    const pathSegments = url.pathname.split('/').filter(Boolean);
    const videoId = pathSegments.at(-1);
    return videoId ? `https://player.vimeo.com/video/${videoId}` : undefined;
}

function getSpotifyEmbedUrl(url: URL): string | undefined {
    const pathSegments = url.pathname.split('/').filter(Boolean);
    if (pathSegments[0] === 'embed' && pathSegments[1] && pathSegments[2]) {
        return `https://open.spotify.com/embed/${pathSegments[1]}/${pathSegments[2]}`;
    }

    if (pathSegments[0] && pathSegments[1]) {
        return `https://open.spotify.com/embed/${pathSegments[0]}/${pathSegments[1]}`;
    }

    return undefined;
}

export function normalizePodcastEmbedUrl(value?: string | null): string | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }

    const rawValue = String(value).trim();
    if (!rawValue || HTML_TAG_RE.test(rawValue)) {
        return undefined;
    }

    const parsedUrl = (() => {
        try {
            return new URL(rawValue);
        }
        catch {
            return undefined;
        }
    })();

    if (!parsedUrl) {
        return undefined;
    }

    const hostname = parsedUrl.hostname.toLowerCase();

    if (BUNNY_HOSTS.has(hostname)) {
        return `https://iframe.mediadelivery.net${parsedUrl.pathname}${parsedUrl.search}`;
    }

    if (YOUTUBE_HOSTS.has(hostname)) {
        return getYoutubeEmbedUrl(parsedUrl);
    }

    if (VIMEO_HOSTS.has(hostname)) {
        return getVimeoEmbedUrl(parsedUrl);
    }

    if (SPOTIFY_HOSTS.has(hostname)) {
        return getSpotifyEmbedUrl(parsedUrl);
    }

    if (APPLE_HOSTS.has(hostname)) {
        return `https://embed.podcasts.apple.com${parsedUrl.pathname}${parsedUrl.search}`;
    }

    return undefined;
}

export function getPodcastEmbedHeight(url?: string | null): number {
    if (!url) {
        return 315;
    }

    if (url.includes('spotify.com')) {
        return 232;
    }

    if (url.includes('apple.com')) {
        return 450;
    }

    return 315;
}
