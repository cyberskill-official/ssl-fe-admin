import * as React from 'react';
import { createContext, use, useEffect, useMemo, useState } from 'react';

export type Theme = 'light' | 'dark';

interface I_ThemeContextProps {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<I_ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('theme') as Theme) || 'light';
        }
        return 'light';
    });

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

    const contextValue = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme]);

    return (
        <ThemeContext value={contextValue}>
            {children}
        </ThemeContext>
    );
};

export function useTheme() {
    const ctx = use(ThemeContext);

    if (!ctx) {
        throw new Error('useTheme must be used within ThemeProvider');
    }

    return ctx;
}
