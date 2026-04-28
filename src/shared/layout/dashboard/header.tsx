import { ChevronDown, Globe, LogOut, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router';

import { useAuth } from '#modules/authn';
import { Button } from '#shared/component';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '#shared/component/dropdown-menu';

import { useTheme } from '../../component/theme-context';

export function Header() {
    const { theme, toggleTheme } = useTheme();
    const { auth, logout, visitWebsite } = useAuth();
    const navigate = useNavigate();
    const displayName = auth?.user?.username || 'Admin';
    const initial = displayName.charAt(0).toUpperCase();

    const handleLogout = () => {
        logout(() => {
            navigate('/auth/login');
        });
    };

    const handleVisitWebsite = () => {
        visitWebsite();
    };

    return (
        <header className="bg-white dark:bg-gray-900 border-b">
            <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
                <div>
                    <div id="portal-header" />
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center whitespace-nowrap bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                        onClick={handleVisitWebsite}
                    >
                        <Globe className="w-4 h-4 mr-2" />
                        Visit Website
                    </Button>

                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="rounded-full p-2 hover:bg-muted transition-colors border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-blue-500" />}
                    </button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="flex items-center gap-2 focus:outline-none"
                                aria-label="Open user menu"
                            >
                                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-medium">
                                    {initial}
                                </div>
                                <span className="text-purple-700 dark:text-purple-300 font-medium">{displayName}</span>
                                <ChevronDown className="w-4 h-4 ml-1 text-purple-700 dark:text-purple-300" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {/* <DropdownMenuItem>Profile</DropdownMenuItem>
                            <DropdownMenuSeparator /> */}
                            <DropdownMenuItem onSelect={handleLogout} variant="destructive">
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
