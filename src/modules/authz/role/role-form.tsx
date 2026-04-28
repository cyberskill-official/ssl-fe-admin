import { useState } from 'react';

import type { T_Role } from '#shared/graphql';

import { Button } from '#shared/component/button';
import { Input } from '#shared/component/input';
import { Label } from '#shared/component/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#shared/component/select';
import { Textarea } from '#shared/component/textarea';
import { useTranslate } from '#shared/i18n';

import type { I_RoleFormProps } from './role.type';

function getAllDescendantIds(roleId: string, allRoles: T_Role[]): string[] {
    const children = allRoles.filter(r => r.parentId === roleId);
    let ids: string[] = children.map(c => c.id!);

    for (const child of children) {
        ids = ids.concat(getAllDescendantIds(child.id!, allRoles));
    }
    return ids;
}

function buildRoleTree(roles: T_Role[], parentId: string | null = null, depth = 0): Array<T_Role & { depth: number }> {
    return roles
        .filter(r => (r.parentId || null) === parentId)
        .flatMap(r => [
            { ...r, depth },
            ...buildRoleTree(roles, r.id!, depth + 1),
        ]);
}

export function RoleForm({ role, onSubmit, onCancel, loading, allRoles, mode }: I_RoleFormProps & { mode?: 'create' | 'edit' }) {
    const { t } = useTranslate('authz');
    const roles = allRoles ?? [];
    const [formData, setFormData] = useState({
        name: mode === 'edit' && role ? role.name || '' : '',
        description: mode === 'edit' && role ? role.description || '' : '',
        parentId: mode === 'edit' && role ? role.parentId || '' : '',
    });

    let parentRoleOptions = roles;
    if (role && role.id) {
        const excludeIds = [role.id, ...getAllDescendantIds(role.id, roles)];
        parentRoleOptions = roles.filter(r => !excludeIds.includes(r.id!));
    }

    const treeOptions: Array<T_Role & { depth: number }> = buildRoleTree(parentRoleOptions);

    const _handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const _handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <form onSubmit={_handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="name">{t('role-name')}</Label>
                <Input
                    id="name"
                    value={formData.name}
                    onChange={e => _handleChange('name', e.target.value)}
                    placeholder={t('role-name-placeholder')}
                    required
                />
            </div>

            <div>
                <Label htmlFor="parentId">{t('parent-role')}</Label>
                <Select value={formData.parentId || '__none__'} onValueChange={value => _handleChange('parentId', value === '__none__' ? '' : value)}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('no-parent-role')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__none__">{t('no-parent-role')}</SelectItem>
                        {treeOptions.length === 0 && (
                            <SelectItem value="_disabled" disabled>{t('no-available-parent-roles')}</SelectItem>
                        )}
                        {treeOptions.map(role => (
                            <SelectItem key={role.id} value={role.id!}>
                                {Array.from({ length: role.depth }).fill('—').join('') + (role.depth > 0 ? ' ' : '') + role.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1 dark:text-slate-400">
                    {t('parent-role-hint')}
                </p>
            </div>

            <div>
                <Label htmlFor="description">{t('description')}</Label>
                <Textarea
                    id="description"
                    value={formData.description}
                    onChange={e => _handleChange('description', e.target.value)}
                    placeholder={t('description-placeholder')}
                    rows={3}
                />
            </div>

            <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                    {t('cancel')}
                </Button>
                <Button type="submit" disabled={loading || !formData.name}>
                    {loading ? (mode === 'edit' ? t('updating') : t('creating')) : mode === 'edit' ? t('update-role') : t('create-role')}
                </Button>
            </div>
        </form>
    );
}
