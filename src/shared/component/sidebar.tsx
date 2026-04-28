import * as React from 'react';

import { cn } from '#shared/util';

export interface I_SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

function Sidebar({ ref, className, ...props }: I_SidebarProps & { ref?: React.RefObject<HTMLDivElement | null> }) {
    return (
        <div
            ref={ref}
            className={cn(
                'flex h-full w-full flex-col bg-background border-r',
                className,
            )}
            {...props}
        />
    );
}
Sidebar.displayName = 'Sidebar';

export interface I_SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

function SidebarHeader({ ref, className, ...props }: I_SidebarHeaderProps & { ref?: React.RefObject<HTMLDivElement | null> }) {
    return (
        <div
            ref={ref}
            className={cn('flex items-center px-6 py-4 border-b', className)}
            {...props}
        />
    );
}
SidebarHeader.displayName = 'SidebarHeader';

export interface I_SidebarContentProps extends React.HTMLAttributes<HTMLDivElement> {}

function SidebarContent({ ref, className, ...props }: I_SidebarContentProps & { ref?: React.RefObject<HTMLDivElement | null> }) {
    return (
        <div
            ref={ref}
            className={cn('flex-1 overflow-auto p-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-slate-700 dark:scrollbar-track-slate-900', className)}
            {...props}
        />
    );
}
SidebarContent.displayName = 'SidebarContent';

export interface I_SidebarFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

function SidebarFooter({ ref, className, ...props }: I_SidebarFooterProps & { ref?: React.RefObject<HTMLDivElement | null> }) {
    return (
        <div
            ref={ref}
            className={cn('p-4 border-t', className)}
            {...props}
        />
    );
}
SidebarFooter.displayName = 'SidebarFooter';

export interface I_SidebarGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

function SidebarGroup({ ref, className, ...props }: I_SidebarGroupProps & { ref?: React.RefObject<HTMLDivElement | null> }) {
    return (
        <div
            ref={ref}
            className={cn('mb-6', className)}
            {...props}
        />
    );
}
SidebarGroup.displayName = 'SidebarGroup';

export interface I_SidebarGroupLabelProps extends React.HTMLAttributes<HTMLDivElement> {}

function SidebarGroupLabel({ ref, className, ...props }: I_SidebarGroupLabelProps & { ref?: React.RefObject<HTMLDivElement | null> }) {
    return (
        <div
            ref={ref}
            className={cn(
                'text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3',
                className,
            )}
            {...props}
        />
    );
}
SidebarGroupLabel.displayName = 'SidebarGroupLabel';

export interface I_SidebarGroupContentProps extends React.HTMLAttributes<HTMLDivElement> {}

function SidebarGroupContent({ ref, className, ...props }: I_SidebarGroupContentProps & { ref?: React.RefObject<HTMLDivElement | null> }) {
    return (
        <div
            ref={ref}
            className={cn('space-y-1', className)}
            {...props}
        />
    );
}
SidebarGroupContent.displayName = 'SidebarGroupContent';

export interface I_SidebarMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {}

function SidebarMenuItem({ ref, className, ...props }: I_SidebarMenuItemProps & { ref?: React.RefObject<HTMLDivElement | null> }) {
    return (
        <div
            ref={ref}
            className={cn('', className)}
            {...props}
        />
    );
}
SidebarMenuItem.displayName = 'SidebarMenuItem';

export {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenuItem,
};
