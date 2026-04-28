import { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router';

import { Badge, Sidebar as Root, ScrollArea, Separator, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenuItem } from '#shared/component';
import { SIDEBAR_ITEMS } from '#shared/constant';
import { usePendingCounts } from '#shared/context/pending-count.context';
import { cn } from '#shared/util';

const SCROLL_POSITION_KEY = 'sidebar-scroll-position';

export function Sidebar() {
    const { pathname } = useLocation();
    const { counts } = usePendingCounts();
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // Restore scroll position on mount and when pathname changes
    useEffect(() => {
        const savedPosition = sessionStorage.getItem(SCROLL_POSITION_KEY);
        if (savedPosition && scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                requestAnimationFrame(() => {
                    scrollContainer.scrollTop = Number.parseInt(savedPosition, 10);
                });
            }
        }
    }, [pathname]);

    // Save scroll position before unmount
    useEffect(() => {
        const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (!scrollContainer)
            return;

        const handleScroll = () => {
            sessionStorage.setItem(SCROLL_POSITION_KEY, scrollContainer.scrollTop.toString());
        };

        scrollContainer.addEventListener('scroll', handleScroll);
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, []);

    const getPendingCount = (path: string): number => {
        if (path.includes('age-verification')) {
            return counts.ageVerification;
        }
        if (path.includes('moderation/media')) {
            return counts.media;
        }
        if (path.includes('/message')) {
            return counts.messages;
        }
        return 0;
    };

    return (
        <Root className="w-64 bg-white dark:bg-gray-900 shadow-sm border-r border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100">
            <SidebarHeader className="py-5 px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center shadow-sm text-white font-bold text-base">
                        S
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            SecretSwingerLust
                        </h1>
                        <p className="text-xs text-gray-500 dark:text-gray-300">Admin Panel</p>
                    </div>
                </div>
            </SidebarHeader>
            <Separator />
            <SidebarContent>
                <ScrollArea ref={scrollAreaRef} className="flex-1 space-y-6">
                    {SIDEBAR_ITEMS.map(({ category, items }) => (
                        <SidebarGroup key={category}>
                            <SidebarGroupLabel className="text-gray-700 dark:text-gray-200">{category}</SidebarGroupLabel>
                            <SidebarGroupContent>
                                {items.map(({ path, label, icon: Icon, status }) => {
                                    const isActive = pathname === path;
                                    return (
                                        <SidebarMenuItem key={path}>
                                            <NavLink
                                                to={path}
                                                className={cn(`group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all`, {
                                                    'bg-purple-50 dark:bg-purple-900 text-purple-700 dark:text-purple-200 border-l-2 border-purple-600 shadow-sm': isActive,
                                                    'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white': !isActive,
                                                })}
                                            >
                                                <Icon className="h-4 w-4 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors" />
                                                <span className="flex-1">{label}</span>
                                                {status === 'DONE' && (
                                                    <span className="text-xs text-green-500">✓</span>
                                                )}
                                                {getPendingCount(path) > 0 && (
                                                    <Badge
                                                        variant="destructive"
                                                        className="ml-auto h-5 px-2 text-xs font-semibold bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white"
                                                    >
                                                        {getPendingCount(path)}
                                                    </Badge>
                                                )}
                                            </NavLink>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarGroupContent>
                        </SidebarGroup>
                    ))}
                </ScrollArea>
            </SidebarContent>
            <Separator />
        </Root>
    );
}
