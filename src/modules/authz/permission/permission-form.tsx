import { useState } from 'react';

import { Button, Input, Label, Switch } from '#shared/component';
import { E_PermissionType } from '#shared/graphql';
import { useTranslate } from '#shared/i18n';

import type { I_PermissionFormProps } from './permission.type';

export function PermissionForm({ permission, mode, onSubmit, onCancel, loading }: I_PermissionFormProps) {
    const { t } = useTranslate('authz');
    const [formData, setFormData] = useState({
        name: mode === 'edit' && permission ? permission.name || '' : '',
        target: mode === 'edit' && permission ? permission.target || '' : '',
        isPublic: mode === 'edit' && permission ? permission.isPublic || false : false,
    });

    const isEditMode = mode === 'edit';
    const isCreateMode = mode === 'create';
    const permissionType = permission?.type;

    const canEditName = isEditMode ? (permissionType === E_PermissionType.ROUTE || permissionType === E_PermissionType.GRAPHQL || permissionType === E_PermissionType.REST) : true;
    const canEditTarget = !isEditMode || permissionType === E_PermissionType.ROUTE;

    const _handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isCreateMode) {
            onSubmit({
                target: formData.target,
                name: formData.name,
                isPublic: formData.isPublic,
            });
        }
        else {
            const updateData: Partial<any> = {
                name: formData.name,
                isPublic: formData.isPublic,
            };

            if (permissionType === E_PermissionType.ROUTE) {
                updateData['target'] = formData.target;
            }

            onSubmit(updateData);
        }
    };

    const _handleChange = (field: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <form onSubmit={_handleSubmit} className="space-y-4">
            {isCreateMode && (
                <div>
                    <Label>{t('permission-type')}</Label>
                    <div className="text-sm text-muted-foreground bg-muted dark:bg-slate-700 p-2 rounded">
                        {t('route-type-auto')}
                    </div>
                </div>
            )}
            {isEditMode && (
                <div>
                    <Label>{t('permission-type')}</Label>
                    <div className="text-sm text-muted-foreground bg-muted dark:bg-slate-700 p-2 rounded">
                        {t(permissionType?.toLowerCase() || 'unknown')}
                    </div>
                </div>
            )}
            {isEditMode && permissionType === E_PermissionType.GRAPHQL && (
                <div>
                    <Label>{t('method')}</Label>
                    <div className="text-sm text-muted-foreground bg-muted dark:bg-slate-700 p-2 rounded">
                        {permission?.method || t('na')}
                    </div>
                </div>
            )}
            {isEditMode && permissionType === E_PermissionType.REST && (
                <div>
                    <Label>{t('method')}</Label>
                    <div className="text-sm text-muted-foreground bg-muted dark:bg-slate-700 p-2 rounded">
                        {permission?.method || t('na')}
                    </div>
                </div>
            )}
            {isEditMode && (
                <div>
                    <Label>{t('target')}</Label>
                    {canEditTarget
                        ? (
                                <Input
                                    id="target"
                                    value={formData.target}
                                    onChange={e => _handleChange('target', e.target.value)}
                                    placeholder={t('target-placeholder')}
                                    required={isCreateMode}
                                    disabled={!canEditTarget}
                                />
                            )
                        : (
                                <div className="text-sm text-muted-foreground bg-muted dark:bg-slate-700 p-2 rounded font-mono">
                                    {permission?.target}
                                </div>
                            )}
                    <p className="text-sm text-muted-foreground mt-1">
                        {t('target-hint')}
                    </p>
                </div>
            )}
            {isCreateMode && (
                <div>
                    <Label htmlFor="target">
                        {t('target')}
                        {' '}
                        *
                    </Label>
                    <Input
                        id="target"
                        value={formData.target}
                        onChange={e => _handleChange('target', e.target.value)}
                        placeholder={t('target-placeholder')}
                        required
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                        {t('target-hint')}
                    </p>
                </div>
            )}
            <div>
                <Label htmlFor="name">
                    {t('name')}
                    {' '}
                    *
                </Label>
                <Input
                    id="name"
                    value={formData.name}
                    onChange={e => _handleChange('name', e.target.value)}
                    placeholder={t('name-placeholder')}
                    required
                    disabled={!canEditName}
                />
                <p className="text-sm text-muted-foreground mt-1">
                    {t('name-hint')}
                </p>
            </div>
            <div className="flex items-center space-x-2">
                <Switch
                    id="isPublic"
                    checked={formData.isPublic}
                    onCheckedChange={checked => _handleChange('isPublic', checked)}
                />
                <Label htmlFor="isPublic">{t('public-permission')}</Label>
            </div>
            <p className="text-sm text-muted-foreground">
                {t('public-hint')}
            </p>
            <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                    {t('cancel')}
                </Button>
                <Button type="submit" disabled={loading || !formData.name || (isCreateMode && !formData.target)}>
                    {loading ? (mode === 'edit' ? t('updating') : t('creating')) : mode === 'edit' ? t('update-permission') : t('create-permission')}
                </Button>
            </div>
        </form>
    );
}
