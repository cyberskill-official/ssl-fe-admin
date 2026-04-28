interface Geolocation {
    latitude: number;
    longitude: number;
    countryCode?: string;
    ip?: string;
    city?: string;
    region?: string;
}

/**
 * Get geolocation using Browser Geolocation API (GPS)
 * This is the most accurate and doesn't require external API calls
 * Requires user permission
 */
export async function getBrowserGeolocation(): Promise<Geolocation> {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            console.warn('Geolocation is not supported by this browser');
            resolve({ latitude: 0, longitude: 0 });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            (error) => {
                console.warn(
                    'Failed to get browser geolocation:',
                    error.message,
                );
                resolve({ latitude: 0, longitude: 0 });
            },
            {
                enableHighAccuracy: false,
                timeout: 5000,
                maximumAge: 300000, // Cache for 5 minutes
            },
        );
    });
}

/**
 * Get geolocation from IP using geojs.io (free, unlimited requests, no API key needed)
 * Fallback: use Browser Geolocation API if IP lookup fails
 */
export async function getGeolocationFromIP(ip?: string): Promise<Geolocation> {
    try {
        // Use geojs.io - free, unlimited requests, no API key
        // If IP is provided, use geo endpoint with IP, otherwise use default endpoint
        const url = ip
            ? `https://get.geojs.io/v1/ip/geo/${ip}.json`
            : 'https://get.geojs.io/v1/ip/geo.json';

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        const result: Geolocation = {
            latitude: Number.parseFloat(data.latitude) || 0,
            longitude: Number.parseFloat(data.longitude) || 0,
            countryCode: data.country_code,
            ip: data.ip,
            city: data.city,
            region: data.region,
        };

        return result;
    }
    catch (error) {
        console.error('geojs.io failed:', error);
        // If specific IP provided, return empty data with that IP
        if (ip) {
            return { latitude: 0, longitude: 0, ip };
        }
        // Otherwise fallback to browser geolocation
        return await getBrowserGeolocation();
    }
}

// Expose to window for testing in development only
if (typeof window !== 'undefined' && import.meta.env.DEV) {
    (
        window as { getGeolocationFromIP?: typeof getGeolocationFromIP }
    ).getGeolocationFromIP = getGeolocationFromIP;
}
