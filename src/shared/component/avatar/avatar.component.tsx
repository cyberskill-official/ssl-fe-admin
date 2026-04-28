import { useState } from 'react';

import type { I_AvatarProps } from './avatar.type';

export function Avatar({ name, src, size = 40, className = '' }: I_AvatarProps) {
    const [imgError, setImgError] = useState(false);
    const initials = name && name.trim()
        ? name.trim().split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : '';
    const dimension = typeof size === 'number' ? `${size}px` : size;

    // Show image if src is provided and not errored
    if (src && !imgError) {
        return (
            <img
                src={src}
                alt={name || 'Avatar'}
                onError={() => setImgError(true)}
                className={`rounded-full object-cover ${className}`}
                style={{ width: dimension, height: dimension }}
            />
        );
    }

    // Show initials if name is provided
    if (initials) {
        return (
            <div
                className={`rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold shadow ${className}`}
                style={{ width: dimension, height: dimension, fontSize: typeof size === 'number' ? `${size * 0.4}px` : undefined }}
            >
                {initials}
            </div>
        );
    }

    // Fallback: anonymous icon
    return (
        <div
            className={`rounded-full bg-gray-300 dark:bg-slate-600 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold ${className}`}
            style={{ width: dimension, height: dimension }}
        >
            <span className="sr-only">Anonymous</span>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2" />
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor" />
            </svg>
        </div>
    );
}
