import { toast } from '@cyberskill/shared/react/toast';
import { useEffect, useMemo, useState } from 'react';

import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Label } from '#shared/component';
import { useTranslate } from '#shared/i18n';

import type { I_UserFormProps } from './user.type';

const UPPERCASE_RE = /[A-Z]/;

export function validatePassword(password: string): string | null {
    if (password.length < 8) {
        return 'Password must be at least 8 characters long';
    }
    if (!UPPERCASE_RE.test(password)) {
        return 'Password must contain at least one uppercase letter';
    }
    return null;
}

export function UserForm({ open, onOpenChange, onSubmit, onCancel, allRoles, defaultRoles, readonlyRoles, loading, user, mode }: I_UserFormProps) {
    const { t } = useTranslate('user');
    const _defaultRoles = useMemo(() => defaultRoles ?? [], [defaultRoles]);
    const _readonlyRoles = readonlyRoles ?? [];
    const [form, setForm] = useState({
        username: user?.username || '',
        email: user?.email || '',
        password: '',
        rolesIds: user?.roles?.map((r: any) => r.id) || _defaultRoles,
    });
    const [passwordError, setPasswordError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            const rolesIds = user?.roles?.map((r: any) => r.id) || _defaultRoles;
            const uniqueRolesIds = Array.from(new Set(rolesIds));

            // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
            setForm(() => ({
                username: user?.username || '',
                email: user?.email || '',
                password: '',
                rolesIds: uniqueRolesIds,
            }));
            // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
            setPasswordError(null);
        }
    }, [open, _defaultRoles, user]);

    const _handleChange = (field: string, value: string | string[]) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (field === 'password') {
            setPasswordError(null);
        }
    };

    const _handleRoleChange = (roleId: string) => {
        if (_readonlyRoles.includes(roleId)) {
            toast.error(t('role-readonly'));
            return;
        }
        setForm((prev) => {
            const exists = prev.rolesIds.includes(roleId);
            let newRolesIds;
            if (exists) {
                newRolesIds = prev.rolesIds.filter(id => id !== roleId);
            }
            else {
                newRolesIds = [...prev.rolesIds, roleId];
            }

            const uniqueRolesIds = Array.from(new Set(newRolesIds));

            return {
                ...prev,
                rolesIds: uniqueRolesIds,
            };
        });
    };

    const _handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (mode === 'create') {
            const error = validatePassword(form.password);
            if (error) {
                setPasswordError(error);
                return;
            }
        }

        onSubmit(form);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>{mode === 'edit' ? t('update-user') : t('add-user')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={_handleSubmit} className="space-y-4">
                    <div>
                        <Label>{t('roles')}</Label>
                        <div className="flex flex-wrap gap-2">
                            {_readonlyRoles.length === 1
                                ? (
                                        allRoles.filter(role => role.id === _readonlyRoles[0]).map(role => (
                                            <Button
                                                key={role.id}
                                                type="button"
                                                variant="default"
                                                size="sm"
                                                disabled
                                                className="opacity-60 cursor-not-allowed"
                                            >
                                                {role.name}
                                                <span className="ml-1 text-xs">
                                                    (
                                                    {t('locked')}
                                                    )
                                                </span>
                                            </Button>
                                        ))
                                    )
                                : (
                                        allRoles.map((role) => {
                                            const isSelected = form.rolesIds.includes(role.id!);
                                            const isReadonly = _readonlyRoles.includes(role.id!);
                                            return (
                                                <Button
                                                    key={role.id}
                                                    type="button"
                                                    variant={isSelected ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => _handleRoleChange(role.id!)}
                                                    disabled={isReadonly}
                                                    className={isReadonly ? 'opacity-60 cursor-not-allowed' : ''}
                                                >
                                                    {role.name}
                                                    {isReadonly && (
                                                        <span className="ml-1 text-xs">
                                                            (
                                                            {t('locked')}
                                                            )
                                                        </span>
                                                    )}
                                                </Button>
                                            );
                                        })
                                    )}
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="username">{t('username')}</Label>
                        <Input
                            id="username"
                            value={form.username}
                            onChange={e => _handleChange('username', e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="email">{t('email')}</Label>
                        <Input
                            id="email"
                            type="email"
                            value={form.email}
                            onChange={e => _handleChange('email', e.target.value)}
                            required
                        />
                    </div>
                    {mode === 'create' && (
                        <div>
                            <Label htmlFor="password">
                                {t('password')}
                                {' *'}
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={form.password}
                                onChange={e => _handleChange('password', e.target.value)}
                                required
                                aria-invalid={!!passwordError}
                            />
                            {passwordError && (
                                <p className="text-red-500 text-xs mt-1" role="alert">{passwordError}</p>
                            )}
                        </div>
                    )}
                    {/* <div>
                        <Label htmlFor="displayName">{t('display-name')}</Label>
                        <Input
                            id="displayName"
                            value={form.displayName}
                            onChange={e => _handleChange('displayName', e.target.value)}
                            placeholder={t('display-name-placeholder')}
                        />
                    </div> */}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button className="cursor-pointer" type="button" variant="outline" onClick={onCancel}>
                            {t('cancel')}
                        </Button>
                        <Button type="submit" disabled={loading || !form.username || !form.email || (mode === 'create' && !form.password) || form.rolesIds.length === 0}>
                            {loading
                                ? (mode === 'edit' ? t('updating') : t('creating'))
                                : mode === 'edit' ? t('update-user') : t('create-user')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
