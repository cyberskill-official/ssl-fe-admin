import * as React from 'react';

import { Button } from './button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';

export interface I_ConfirmDialogProps {
    open: boolean;
    title?: string;
    description?: React.ReactNode;
    onConfirm: () => void;
    onCancel: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    loading?: boolean;
}

export function ConfirmDialog({
    open,
    title = 'Are you sure?',
    description,
    onConfirm,
    onCancel,
    confirmLabel = 'Delete',
    cancelLabel = 'Cancel',
    loading = false,
}: I_ConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={open => !open && onCancel()}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                {description && <div className="py-4">{description}</div>}
                <div className="flex justify-end gap-2">
                    <Button className="cursor-pointer" variant="outline" onClick={onCancel} disabled={loading}>{cancelLabel}</Button>
                    <Button variant="destructive" onClick={onConfirm} disabled={loading}>
                        {loading ? 'Deleting...' : confirmLabel}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
