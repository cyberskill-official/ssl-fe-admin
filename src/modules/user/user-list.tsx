import type { ColumnDef } from '@tanstack/react-table';

import {
    Calendar,
    Clock,
    Download,
    Edit,
    FileText,
    Maximize2,
    Minimize2,
    RotateCcw,
    ShieldCheck,
    ShieldX,
    Trash,
    User,
    UserCheck,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { T_User } from '#shared/graphql';

import { useGetCountries } from '#modules/location/country';
import { useAgeVerification } from '#modules/moderation/age-verification/age-verification.hook';
import { Badge, Button } from '#shared/component';
import { DataTable } from '#shared/component/data-table';
import { Pagination } from '#shared/component/pagination';
import { E_RegisterStep } from '#shared/graphql';
import { useTranslate } from '#shared/i18n';
import { getGeolocationFromIP } from '#shared/util/geolocation';

import type { I_UserListProps } from './user.type';

import { UserPricingCell } from './user-pricing-cell';
import { useGetBlocks, useGetSubscriptionPrice, useGetUsers } from './user.hook';

export function UserList({
    users,
    loading,
    totalDocs,
    page,
    totalPages,
    limit,
    hasNextPage,
    hasPrevPage,
    onPageChange,
    onLimitChange,
    onEditUser,
    onPermanentDelete,
    onChangePaymentDate,
    onUpdateUserNotes,
    onBlockUser,
    onUnblockUser,
    onRestoreUser,
    onRefresh,
}: I_UserListProps & {
    onEditUser?: (user: T_User) => void;
    onPermanentDelete?: (user: T_User) => void;
    onChangePaymentDate?: (user: T_User, newDate: Date) => void;
    onUpdateUserNotes?: (user: T_User, notes: string) => void;
    onBlockUser?: (user: T_User) => void;
    onUnblockUser?: (user: T_User) => void;
    onRestoreUser?: (user: T_User) => void;
}) {
    const { t } = useTranslate('user');
    const {
        pricing,
        loading: _pricingLoading,
        error: _pricingError,
    } = useGetSubscriptionPrice();
    const { blocks: _blocks, refetch: _refetchBlocks } = useGetBlocks();
    const {
        approveAgeVerify,
        rejectAgeVerify,
        loading: verificationLoading,
    } = useAgeVerification();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [ipCountries, setIpCountries] = useState<Record<string, string>>({});
    const ipCountriesRef = useRef(ipCountries);

    useEffect(() => {
        ipCountriesRef.current = ipCountries;
    }, [ipCountries]);

    const { countries } = useGetCountries({}, { pagination: false });

    const { users: allUsersForExport, loading: exportLoading } = useGetUsers(
        { isDel: false },
        { page: 1, limit: totalDocs || 10000, skip: !isExporting },
    );

    const getAgeVerificationStatus = (user: T_User) => {
        if (!user.ageVerify) {
            return 'not_submitted';
        }
        return user.ageVerify.status?.toLowerCase() || 'unknown';
    };

    const exportEmails = async () => {
        setIsExporting(true);
        await new Promise(resolve => setTimeout(resolve, 100));
    };

    useEffect(() => {
        if (isExporting && !exportLoading && allUsersForExport.length > 0) {
            const emails = allUsersForExport
                .map(user => user.email)
                .filter(email => email)
                .join('\n');

            const blob = new Blob([emails], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `user-emails-${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
            setIsExporting(false);
        }
    }, [isExporting, exportLoading, allUsersForExport]);

    useEffect(() => {
        const loadIpCountries = async () => {
            const newIpCountries: Record<string, string> = {};
            const uniqueIps = [...new Set(users.map(u => u.lastLoginIp).filter(Boolean))] as string[];

            const ipsToLoad = uniqueIps.filter(ip => !ipCountriesRef.current[ip]);
            if (ipsToLoad.length === 0) {
                return;
            }

            await Promise.all(
                ipsToLoad.map(async (ip) => {
                    try {
                        const geo = await getGeolocationFromIP(ip);
                        if (geo.countryCode) {
                            const country = countries.find(c => c?.iso2?.toLowerCase() === geo.countryCode?.toLowerCase());
                            if (country?.name) {
                                newIpCountries[ip] = country.name;
                            }
                        }
                    }
                    catch {
                    }
                }),
            );

            if (Object.keys(newIpCountries).length > 0) {
                setIpCountries(prev => ({ ...prev, ...newIpCountries }));
            }
        };

        if (users.length > 0 && countries.length > 0) {
            loadIpCountries();
        }
    }, [users, countries]);

    const [showPaymentDateModal, setShowPaymentDateModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<T_User | null>(null);
    const [newPaymentDate, setNewPaymentDate] = useState('');
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [selectedUserForNotes, setSelectedUserForNotes]
        = useState<T_User | null>(null);
    const [userNotes, setUserNotes] = useState('');
    const [showManualVerificationModal, setShowManualVerificationModal]
        = useState(false);
    const [selectedUserForVerification, setSelectedUserForVerification]
        = useState<T_User | null>(null);
    const [verificationAction, setVerificationAction] = useState<
        'approve' | 'reject'
    >('approve');
    const [rejectionReason, setRejectionReason] = useState('');
    const [confirmManualApproval, setConfirmManualApproval] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [selectedUserForProfile, setSelectedUserForProfile] = useState<T_User | null>(null);

    useEffect(() => {
        console.warn('Current pricing state:', pricing);
    }, [pricing]);

    const _formatDate = (date: string | Date) => {
        return new Date(date).toLocaleDateString();
    };

    const _formatDateTime = (date: string | Date) => {
        const dateObj = new Date(date);
        return `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString(
            [],
            { hour: '2-digit', minute: '2-digit' },
        )}`;
    };

    const _getNativeLanguageName = (user: T_User) => {
        if (!user.nativeLanguage?.name) {
            return t('na');
        }
        const languageName = user.nativeLanguage.name;
        return languageName.charAt(0).toUpperCase() + languageName.slice(1);
    };

    const _getCountryName = (user: T_User) => {
        if (user.lastLoginIp && ipCountries[user.lastLoginIp]) {
            const countryName = ipCountries[user.lastLoginIp]!;
            return countryName.charAt(0).toUpperCase() + countryName.slice(1);
        }
        if (!user.partner1?.location?.country?.name) {
            return t('na');
        }
        const countryName = user.partner1.location.country.name;
        return countryName.charAt(0).toUpperCase() + countryName.slice(1);
    };

    const _getRoles = (user: T_User) => {
        if (!user.roles || user.roles.length === 0) {
            return [];
        }

        return user.roles
            .filter(role => role !== null && role?.name)
            .map(role => ({
                name: role?.name || 'USER',
                isPaid: role?.name === 'PAID_MEMBER' || role?.name === 'PROMO_MEMBER',
            }));
    };

    const _getRegisterStepLabel = (registerStep?: string | null) => {
        if (!registerStep) {
            return t('na');
        }
        switch (registerStep) {
            case E_RegisterStep.VERIFY_EMAIL:
                return t('Verify Email');
            case E_RegisterStep.PERSONAL_INFO:
                return t('Personal Info');
            case E_RegisterStep.PREFERENCES:
                return t('Preferences');
            case E_RegisterStep.MEMBERSHIP:
                return t('Membership');
            case E_RegisterStep.COMPLETE:
                return t('Complete');
            default:
                return registerStep;
        }
    };

    const _getRegisterStepBadgeColor = (registerStep?: string | null) => {
        if (!registerStep) {
            return 'bg-gray-100 text-gray-600';
        }
        switch (registerStep) {
            case E_RegisterStep.VERIFY_EMAIL:
                return 'bg-yellow-100 text-yellow-800';
            case E_RegisterStep.PERSONAL_INFO:
                return 'bg-blue-100 text-blue-800';
            case E_RegisterStep.PREFERENCES:
                return 'bg-purple-100 text-purple-800';
            case E_RegisterStep.MEMBERSHIP:
                return 'bg-orange-100 text-orange-800';
            case E_RegisterStep.COMPLETE:
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    const columns: ColumnDef<T_User>[] = [
        {
            accessorKey: 'username',
            header: t('username'),
            cell: ({ row }) => (
                <span className="font-mono text-xs">
                    {row.getValue('username') || t('na')}
                </span>
            ),
        },
        {
            accessorKey: 'lastLoginIp',
            header: t('IP Address'),
            cell: ({ row }) => (
                <span className="font-mono text-xs">
                    {row.getValue('lastLoginIp') || t('na')}
                </span>
            ),
        },
        {
            accessorKey: 'email',
            header: t('email'),
            cell: ({ row }) => (
                <span className="font-mono text-xs">
                    {row.getValue('email') || t('na')}
                </span>
            ),
        },
        {
            accessorKey: 'registerStep',
            header: t('Register Step'),
            cell: ({ row }) => {
                const registerStep = row.getValue('registerStep') as string;
                return (
                    <Badge className={_getRegisterStepBadgeColor(registerStep)}>
                        {_getRegisterStepLabel(registerStep)}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'accountType',
            header: t('Account Type'),
            cell: ({ row }) => {
                const accountType = row.getValue('accountType') as string;
                return (
                    <Badge variant={accountType === 'COUPLE' ? 'default' : 'secondary'}>
                        {accountType || t('na')}
                    </Badge>
                );
            },
        },
        {
            id: 'country',
            header: t('Country'),
            cell: ({ row }) => {
                const user = row.original;
                const countryFromIp = user.lastLoginIp && ipCountries[user.lastLoginIp];
                return (
                    <span
                        className="text-sm"
                        title={countryFromIp ? `Based on IP: ${user.lastLoginIp}` : 'Based on signup location'}
                    >
                        {_getCountryName(user)}
                    </span>
                );
            },
        },
        {
            id: 'nativeLanguage',
            header: t('Language'),
            cell: ({ row }) => (
                <span className="text-sm">
                    {_getNativeLanguageName(row.original)}
                </span>
            ),
        },
        {
            id: 'price',
            header: t('Price'),
            cell: ({ row }) => {
                const user = row.original;
                return (
                    <UserPricingCell
                        userIp={user.lastLoginIp || undefined}
                        type="price"
                    />
                );
            },
        },
        {
            id: 'taxRate',
            header: t('VAT'),
            cell: ({ row }) => {
                const user = row.original;
                return (
                    <UserPricingCell
                        userIp={user.lastLoginIp || undefined}
                        type="tax"
                    />
                );
            },
        },
        {
            accessorKey: 'membershipExpiresAt',
            header: t('next payment date'),
            cell: ({ row }) => {
                const membershipExpiresAt = row.getValue(
                    'membershipExpiresAt',
                ) as string | Date;
                const user = row.original;

                const handleChangePaymentDate = () => {
                    setSelectedUser(user);
                    const thirtyDaysFromNow = new Date();
                    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                    setNewPaymentDate(
                        thirtyDaysFromNow.toISOString().split('T')[0] || '',
                    );
                    setShowPaymentDateModal(true);
                };

                return (
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">
                            {membershipExpiresAt
                                ? _formatDate(membershipExpiresAt)
                                : t('na')}
                        </span>
                        {onChangePaymentDate && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleChangePaymentDate}
                                className="p-1 h-6 w-6 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                title={t(
                                    'Grant 30 days free / Adjust payment date',
                                )}
                            >
                                <Calendar size={12} />
                            </Button>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'flagCount',
            header: t('Red Flags'),
            cell: ({ row }) => {
                const flagCount = row.getValue('flagCount') as number;
                return (
                    <span className="text-sm text-muted-foreground">
                        {flagCount ?? t('na')}
                    </span>
                );
            },
        },
        {
            id: 'roles',
            header: t('roles'),
            cell: ({ row }) => {
                const roles = _getRoles(row.original);
                if (roles.length === 0) {
                    return <span className="text-sm text-gray-400">{t('no-roles')}</span>;
                }

                return (
                    <div className="flex flex-wrap gap-1">
                        {roles.map((role, index) => (
                            <span
                                // eslint-disable-next-line react/no-array-index-key
                                key={index}
                                className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                    role.isPaid
                                        ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700'
                                }`}
                            >
                                {role.name}
                            </span>
                        ))}
                    </div>
                );
            },
        },
        {
            id: 'ageVerification',
            header: t('Age Verification'),
            cell: ({ row }) => {
                const user = row.original;
                const status = getAgeVerificationStatus(user);
                return (
                    <div className="flex items-center gap-2">
                        {status === 'approved' && (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-800 hover:text-white transition-colors">
                                <UserCheck className="w-3 h-3 mr-1" />
                                {t('Verified')}
                            </Badge>
                        )}
                        {status === 'pending' && (
                            <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-800 hover:text-white transition-colors">
                                <Clock className="w-3 h-3 mr-1" />
                                {t('Pending')}
                            </Badge>
                        )}
                        {status === 'rejected' && (
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-800 hover:text-white transition-colors">
                                <X className="w-3 h-3 mr-1" />
                                {t('Rejected')}
                            </Badge>
                        )}
                        {status === 'not_submitted' && (
                            <Badge
                                variant="secondary"
                                className="bg-gray-100 text-gray-600"
                            >
                                {t('Not Submitted')}
                            </Badge>
                        )}
                    </div>
                );
            },
        },
        {
            id: 'status',
            header: t('Account Status'),
            cell: ({ row }) => {
                const user = row.original;
                const isDeleted = user.isDel === true;
                const isDeactivated = user.isDeactivated === true;
                return (
                    <div className="flex gap-2">
                        {isDeactivated && (
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-800 hover:text-white transition-colors">
                                {t('deactivated-users')}
                            </Badge>
                        )}
                        {isDeleted && !isDeactivated && !user.isAdminBlocked && (
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-800 hover:text-white transition-colors">
                                {t('deleted')}
                            </Badge>
                        )}
                        {!isDeleted && (
                            <Badge
                                className={
                                    user.isActive
                                        ? 'bg-green-100 text-green-800 hover:bg-green-800 hover:text-white transition-colors'
                                        : 'bg-gray-100 text-gray-800'
                                }
                            >
                                {user.isActive ? t('active') : t('inactive')}
                            </Badge>
                        )}
                        {user.isEmailVerified === true && (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-800 hover:text-white transition-colors">
                                {t('verified')}
                            </Badge>
                        )}
                        {user.isAdminBlocked && (
                            <Badge className="bg-red-600 text-white">
                                🚫
                                {' '}
                                {t('Blocked')}
                            </Badge>
                        )}
                        {user.isGuardianView && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                                👁️
                                {' '}
                                {t('Guardian View')}
                            </Badge>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'createdAt',
            header: t('created'),
            cell: ({ row }) => {
                const createdAt = row.getValue('createdAt') as string | Date;
                return (
                    <span className="text-sm text-muted-foreground">
                        {createdAt ? _formatDate(createdAt) : t('na')}
                    </span>
                );
            },
        },
        {
            accessorKey: 'updatedAt',
            header: t('Updated'),
            cell: ({ row }) => {
                const updatedAt = row.getValue('updatedAt') as string | Date;
                return (
                    <span className="text-sm text-muted-foreground">
                        {updatedAt ? _formatDateTime(updatedAt) : t('na')}
                    </span>
                );
            },
        },
        {
            accessorKey: 'isOnline',
            header: t('Online Status'),
            cell: ({ row }) => {
                const isOnline = row.getValue('isOnline') as boolean;
                return (
                    <Badge variant={isOnline ? 'default' : 'secondary'}>
                        {isOnline ? '🟢 Online' : '⚪ Offline'}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'lastOnline',
            header: t('Last Online'),
            cell: ({ row }) => {
                const lastOnline = row.getValue('lastOnline') as string | Date;
                return (
                    <span className="text-sm text-muted-foreground">
                        {lastOnline ? _formatDateTime(lastOnline) : t('na')}
                    </span>
                );
            },
        },
        {
            id: 'actions',
            header: t('actions'),
            cell: ({ row }) => {
                const user = row.original;
                const isBlocked = user.isAdminBlocked === true;
                const isDeleted = user.isDel === true;
                const verificationStatus = getAgeVerificationStatus(user);
                return (
                    <div className="flex justify-end gap-1">
                        {!isBlocked && !isDeleted && (
                            <>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => {
                                        setSelectedUserForProfile(user);
                                        setShowProfileModal(true);
                                    }}
                                    title={t('View Profile Details')}
                                    aria-label={t('View Profile Details')}
                                    className="text-purple-600 hover:text-purple-800"
                                >
                                    <User className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => {
                                        setSelectedUserForNotes(user);
                                        setUserNotes('');
                                        setShowNotesModal(true);
                                    }}
                                    title={t('Add/Edit Notes')}
                                    aria-label={t('Add/Edit Notes')}
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    <FileText className="w-4 h-4" />
                                </Button>

                                {/* Manual Age Verification Button */}
                                {(verificationStatus === 'not_submitted'
                                    || verificationStatus === 'rejected') && (
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => {
                                            setSelectedUserForVerification(
                                                user,
                                            );
                                            setVerificationAction('approve');
                                            setConfirmManualApproval(false);
                                            setShowManualVerificationModal(
                                                true,
                                            );
                                        }}
                                        title={t('Manual Age Verification')}
                                        aria-label={t('Manual Age Verification')}
                                        className="text-green-600 hover:text-green-800"
                                    >
                                        <ShieldCheck className="w-4 h-4" />
                                    </Button>
                                )}

                                {verificationStatus === 'pending' && (
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => {
                                            setSelectedUserForVerification(
                                                user,
                                            );
                                            setVerificationAction('approve');
                                            setConfirmManualApproval(false);
                                            setShowManualVerificationModal(
                                                true,
                                            );
                                        }}
                                        title={t('Review Pending Verification')}
                                        aria-label={t('Review Pending Verification')}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        <UserCheck className="w-4 h-4" />
                                    </Button>
                                )}

                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => onEditUser?.(user)}
                                    title={t('edit')}
                                    aria-label={t('edit')}
                                >
                                    <Edit className="w-4 h-4" />
                                </Button>
                                {/* Block/Unblock button - Use isAdminBlocked field instead of blocks list */}
                                {!user.isAdminBlocked
                                    ? (
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="text-orange-600 hover:text-orange-800"
                                                onClick={() => onBlockUser?.(user)}
                                                title={t('block-user')}
                                                aria-label={t('block-user')}
                                            >
                                                <ShieldX className="w-4 h-4" />
                                            </Button>
                                        )
                                    : (
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="text-green-600 hover:text-green-800"
                                                onClick={() => onUnblockUser?.(user)}
                                                title={t('unblock-user')}
                                                aria-label={t('unblock-user')}
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                            </Button>
                                        )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive"
                                    onClick={() => onPermanentDelete?.(user)}
                                    aria-label={t('delete')}
                                    title={t('delete')}
                                >
                                    <Trash className="w-4 h-4" />
                                </Button>
                            </>
                        )}
                        {isBlocked && (
                            <>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="text-green-600 hover:text-green-700"
                                    onClick={() => onUnblockUser?.(user)}
                                    title={t('unblock-user')}
                                    aria-label={t('unblock-user')}
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </Button>
                            </>
                        )}
                        {isDeleted && !isBlocked && (
                            <>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="text-blue-600 hover:text-blue-700"
                                    onClick={() => onRestoreUser?.(user)}
                                    title={t('restore')}
                                    aria-label={t('restore')}
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-red-700"
                                    onClick={() => onPermanentDelete?.(user)}
                                    aria-label={t('delete-permanently')}
                                    title={t('delete-permanently')}
                                >
                                    <Trash className="w-4 h-4" />
                                </Button>
                            </>
                        )}
                    </div>
                );
            },
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">{t('loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`space-y-4 ${
                isFullscreen
                    ? 'fixed inset-0 z-50 bg-white dark:bg-slate-900 p-6 overflow-auto'
                    : ''
            }`}
        >
            {/* Fullscreen toggle button */}
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        {t('Showing')}
                        {' '}
                        {users.length}
                        {' '}
                        {t('of')}
                        {' '}
                        {totalDocs}
                        {' '}
                        {t('users')}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {t('Per page')}
                            :
                        </span>
                        {[10, 25, 50, 100].map(size => (
                            <Button
                                key={size}
                                variant={limit === size ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => onLimitChange?.(size)}
                                className="h-7 px-2 text-xs"
                            >
                                {size}
                            </Button>
                        ))}
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={exportEmails}
                        disabled={isExporting}
                        className="flex items-center gap-2"
                        title={t('Export all user emails')}
                    >
                        <Download className="w-4 h-4" />
                        {isExporting ? t('Exporting...') : t('Export Emails')}
                        {' '}
                        (
                        {totalDocs}
                        )
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="flex items-center gap-2"
                        title={
                            isFullscreen
                                ? t('Exit fullscreen')
                                : t('Enter fullscreen')
                        }
                    >
                        {isFullscreen
                            ? (
                                    <>
                                        <Minimize2 className="w-4 h-4" />
                                        {t('Exit Fullscreen')}
                                    </>
                                )
                            : (
                                    <>
                                        <Maximize2 className="w-4 h-4" />
                                        {t('Fullscreen')}
                                    </>
                                )}
                    </Button>
                </div>
            </div>

            {/* Enhanced fullscreen table with strong row highlighting */}
            <style>
                {`
                    /* Strong row highlight on hover to prevent tracking mistakes across columns */
                    table tbody tr:hover {
                        background: linear-gradient(90deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.15) 100%) !important;
                        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.4) inset;
                        transform: scale(1.002);
                        transition: all 0.2s ease-in-out;
                        cursor: pointer;
                    }
                    table tbody tr:hover td {
                        background-color: transparent !important;
                        font-weight: 500;
                    }
                `}
            </style>
            <div className="w-full overflow-x-auto data-table-container">
                <DataTable
                    columns={columns}
                    data={users}
                    searchKey={undefined}
                    searchPlaceholder={undefined}
                    showPagination={false}
                    showToolbar={false}
                    showColumnVisibility={false}
                    pageSize={limit}
                />
            </div>
            <Pagination
                total={totalDocs}
                page={page}
                limit={limit}
                onPageChange={onPageChange}
                onLimitChange={onLimitChange}
                hasNextPage={hasNextPage}
                hasPrevPage={hasPrevPage}
                totalPages={totalPages}
                sticky
            />

            {/* Payment Date Change Modal */}
            {showPaymentDateModal && selectedUser && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-[90vw] shadow-2xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {t('Change Payment Date')}
                            </h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowPaymentDateModal(false)}
                                className="p-1 h-6 w-6"
                            >
                                <X size={16} />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {t('User')}
                                    :
                                    {' '}
                                    <strong>
                                        {selectedUser.username
                                            || selectedUser.email}
                                    </strong>
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    {t('Current payment date')}
                                    :
                                    {' '}
                                    <strong>
                                        {selectedUser.membershipExpiresAt
                                            ? _formatDate(
                                                    selectedUser.membershipExpiresAt,
                                                )
                                            : t('na')}
                                    </strong>
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t('New payment date')}
                                </label>
                                <input
                                    type="date"
                                    value={newPaymentDate}
                                    onChange={e =>
                                        setNewPaymentDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                    <strong>
                                        {t('Common actions')}
                                        :
                                    </strong>
                                    <br />
                                    •
                                    {' '}
                                    {t(
                                        'Grant 30 days free for complaint resolution',
                                    )}
                                    <br />
                                    •
                                    {t('Extend due to payment error')}
                                    <br />
                                    •
                                    {t('Custom date for special cases')}
                                </p>
                            </div>
                        </div>

                        <div className="flex space-x-3 mt-6">
                            <Button
                                variant="outline"
                                onClick={() => setShowPaymentDateModal(false)}
                                className="flex-1"
                            >
                                {t('Cancel')}
                            </Button>
                            <Button
                                onClick={() => {
                                    if (onChangePaymentDate && newPaymentDate) {
                                        onChangePaymentDate(
                                            selectedUser,
                                            new Date(newPaymentDate),
                                        );
                                        setShowPaymentDateModal(false);
                                        setSelectedUser(null);
                                        setNewPaymentDate('');
                                    }
                                }}
                                className="flex-1"
                                disabled={!newPaymentDate}
                            >
                                {t('Update Payment Date')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Notes Modal */}
            {showNotesModal && selectedUserForNotes && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-[90vw] shadow-2xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {t('User Notes')}
                            </h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowNotesModal(false)}
                                className="p-1 h-6 w-6"
                            >
                                <X size={16} />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {t('User')}
                                    :
                                    {' '}
                                    <strong>
                                        {selectedUserForNotes.username
                                            || selectedUserForNotes.email}
                                    </strong>
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t('Existing Notes')}
                                </label>
                                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-3 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 mb-4">
                                    {selectedUserForNotes.notes
                                        && selectedUserForNotes.notes.some(note => note?.type === 'MEMBER_NOTE')
                                        ? (
                                                selectedUserForNotes.notes
                                                    .filter(note => note?.type === 'MEMBER_NOTE')
                                                    .map(
                                                        note => (
                                                            <div
                                                                key={
                                                                    note?.createdAt
                                                                    || Math.random()
                                                                }
                                                                className="mb-2 pb-2 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                                                            >
                                                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                                    {note?.type || 'Note'}
                                                                    {' - '}
                                                                    {note?.createdAt
                                                                        ? new Date(
                                                                                note.createdAt,
                                                                            ).toLocaleDateString()
                                                                        : 'Unknown date'}
                                                                </div>
                                                                <div className="text-sm text-gray-900 dark:text-gray-100">
                                                                    {note?.content
                                                                        || 'No content'}
                                                                </div>
                                                            </div>
                                                        ),
                                                    )
                                            )
                                        : (
                                                <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                                                    {t('No notes yet')}
                                                </div>
                                            )}
                                </div>

                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t('Add New Note')}
                                </label>
                                <textarea
                                    value={userNotes}
                                    onChange={e =>
                                        setUserNotes(e.target.value)}
                                    placeholder={t(
                                        'Add notes about this user (warnings, special cases, etc.)',
                                    )}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
                                    rows={4}
                                />
                            </div>

                            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                    <strong>
                                        {t('Use cases')}
                                        :
                                    </strong>
                                    <br />
                                    •
                                    {t('Issue warnings for policy violations')}
                                    <br />
                                    •
                                    {t('Track complaint resolutions')}
                                    <br />
                                    •
                                    {t('Note special account status')}
                                    <br />
                                    •
                                    {t('Record important communications')}
                                </p>
                            </div>
                        </div>

                        <div className="flex space-x-3 mt-6">
                            <Button
                                variant="outline"
                                onClick={() => setShowNotesModal(false)}
                                className="flex-1"
                            >
                                {t('Cancel')}
                            </Button>
                            <Button
                                onClick={() => {
                                    if (
                                        onUpdateUserNotes
                                        && selectedUserForNotes
                                    ) {
                                        onUpdateUserNotes(
                                            selectedUserForNotes,
                                            userNotes,
                                        );
                                        setShowNotesModal(false);
                                        setSelectedUserForNotes(null);
                                        setUserNotes('');
                                    }
                                }}
                                className="flex-1"
                            >
                                {t('Add Note')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manual Age Verification Modal */}
            {showManualVerificationModal && selectedUserForVerification && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-[90vw] shadow-2xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {t('Manual Age Verification')}
                            </h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                    setShowManualVerificationModal(false)}
                                className="p-1 h-6 w-6"
                            >
                                <X size={16} />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {t('User')}
                                    :
                                    {' '}
                                    <strong>
                                        {selectedUserForVerification.username
                                            || selectedUserForVerification.email}
                                    </strong>
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    {t('Current status')}
                                    :
                                    {' '}
                                    <span className="font-medium">
                                        {getAgeVerificationStatus(
                                            selectedUserForVerification,
                                        )}
                                    </span>
                                </p>
                            </div>

                            {/* Warning for users without ageVerify data */}
                            {!selectedUserForVerification.ageVerify && (
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md border-l-4 border-yellow-400">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0">
                                            <svg
                                                className="h-5 w-5 text-yellow-400"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                                {t('No Age Verification Data')}
                                            </h3>
                                            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                                                <p>
                                                    {t(
                                                        'This user has not submitted any age verification documents through the automatic system. Manual approval will create a new verification record.',
                                                    )}
                                                </p>
                                                <p className="mt-2 font-semibold">
                                                    {t(
                                                        '⚠️ Important: Only approve if you have verified the user\'s age through alternative methods (video call, support ticket, etc.)',
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
                                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                                    {t('Manual Verification Process')}
                                </h4>
                                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                                    {t(
                                        'Use this option when automatic ID verification fails or users cannot provide digital documents.',
                                    )}
                                </p>
                                <div className="text-xs text-blue-600 dark:text-blue-400">
                                    <strong>{t('Valid methods:')}</strong>
                                    <br />
                                    •
                                    {t('Video call verification')}
                                    <br />
                                    •
                                    {' '}
                                    {t('Phone verification with ID check')}
                                    <br />
                                    •
                                    {' '}
                                    {t('Support ticket with manual review')}
                                    <br />
                                    •
                                    {' '}
                                    {t('Third-party verification service')}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t('Verification Action')}
                                </label>
                                <div className="flex gap-3 mb-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="verificationAction"
                                            value="approve"
                                            checked={
                                                verificationAction === 'approve'
                                            }
                                            onChange={e =>
                                                setVerificationAction(
                                                    e.target.value as
                                                    | 'approve'
                                                    | 'reject',
                                                )}
                                            className="mr-2"
                                        />
                                        <span className="text-green-600 font-medium">
                                            {t('Approve (18+)')}
                                        </span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="verificationAction"
                                            value="reject"
                                            checked={
                                                verificationAction === 'reject'
                                            }
                                            onChange={e =>
                                                setVerificationAction(
                                                    e.target.value as
                                                    | 'approve'
                                                    | 'reject',
                                                )}
                                            className="mr-2"
                                        />
                                        <span className="text-red-600 font-medium">
                                            {t('Reject (Under 18)')}
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {verificationAction === 'reject' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t('Rejection Reason')}
                                        {' '}
                                        *
                                    </label>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={e =>
                                            setRejectionReason(e.target.value)}
                                        placeholder={t(
                                            'Provide a clear reason for rejection (e.g., verified under 18, suspicious documents, etc.)',
                                        )}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
                                        rows={3}
                                        required
                                    />
                                </div>
                            )}

                            {/* Confirmation checkbox for users without ageVerify data */}
                            {!selectedUserForVerification.ageVerify
                                && verificationAction === 'approve' && (
                                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-md border-l-4 border-orange-400">
                                    <label className="flex items-start cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={confirmManualApproval}
                                            onChange={e =>
                                                setConfirmManualApproval(
                                                    e.target.checked,
                                                )}
                                            className="mt-1 mr-3 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                        />
                                        <div className="flex-1">
                                            <span className="text-sm font-medium text-orange-900 dark:text-orange-100">
                                                {t(
                                                    'I confirm that I have manually verified this user\'s age through an alternative method',
                                                )}
                                            </span>
                                            <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                                                {t(
                                                    'This user has no existing verification data. By checking this box, you confirm that you have verified their age is 18+ through video call, phone verification, or other approved methods.',
                                                )}
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            )}

                            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                    <strong>{t('Important:')}</strong>
                                    {' '}
                                    {t(
                                        'Manual verification should only be used after careful identity verification through alternative methods. Document your verification process in the user notes.',
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex space-x-3 mt-6">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowManualVerificationModal(false);
                                    setSelectedUserForVerification(null);
                                    setVerificationAction('approve');
                                    setRejectionReason('');
                                    setConfirmManualApproval(false);
                                }}
                                className="flex-1"
                            >
                                {t('Cancel')}
                            </Button>
                            <Button
                                onClick={async () => {
                                    if (!selectedUserForVerification?.id) {
                                        return;
                                    }

                                    try {
                                        if (verificationAction === 'approve') {
                                            await approveAgeVerify({
                                                userId: selectedUserForVerification.id,
                                            });
                                        }
                                        else {
                                            if (!rejectionReason.trim()) {
                                                // Replace alert with toast or similar
                                                console.warn(
                                                    t(
                                                        'Please provide a rejection reason',
                                                    ),
                                                );
                                                return;
                                            }
                                            await rejectAgeVerify({
                                                userId: selectedUserForVerification.id,
                                                reason: rejectionReason,
                                            });
                                        }

                                        setShowManualVerificationModal(false);
                                        setSelectedUserForVerification(null);
                                        setVerificationAction('approve');
                                        setRejectionReason('');
                                        setConfirmManualApproval(false);

                                        // Refresh the user list to show updated status
                                        onRefresh?.();
                                    }
                                    catch (error) {
                                        console.error(
                                            'Verification error:',
                                            error,
                                        );
                                    }
                                }}
                                className={`flex-1 ${
                                    verificationAction === 'approve'
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-red-600 hover:bg-red-700'
                                }`}
                                disabled={
                                    verificationLoading
                                    || (verificationAction === 'reject'
                                        && !rejectionReason.trim())
                                    || (verificationAction === 'approve'
                                        && !selectedUserForVerification.ageVerify
                                        && !confirmManualApproval)
                                }
                            >
                                {verificationLoading
                                    ? t('Processing...')
                                    : verificationAction === 'approve'
                                        ? t('Approve Age Verification')
                                        : t('Reject Age Verification')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Details Modal */}
            {showProfileModal && selectedUserForProfile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                            <h2 className="text-2xl font-bold">
                                {t('Profile Details')}
                                {' '}
                                - @
                                {selectedUserForProfile.username}
                            </h2>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    setShowProfileModal(false);
                                    setSelectedUserForProfile(null);
                                }}
                                aria-label={t('Close')}
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Engagement Statistics */}
                            <div className="border-b pb-4">
                                <h3 className="text-lg font-semibold mb-3 text-gray-700">
                                    {t('Engagement Statistics')}
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-blue-600">{selectedUserForProfile.followerCount || 0}</div>
                                        <div className="text-sm text-gray-600 mt-1">{t('Followers')}</div>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-green-600">{selectedUserForProfile.followingCount || 0}</div>
                                        <div className="text-sm text-gray-600 mt-1">{t('Following')}</div>
                                    </div>
                                    <div className="bg-yellow-50 p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-yellow-600">
                                            {selectedUserForProfile.freeEventCount ?? t('na')}
                                        </div>
                                        <div className="text-sm text-gray-600 mt-1">{t('Free Events')}</div>
                                    </div>
                                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-purple-600">
                                            {selectedUserForProfile.hasUpcomingEvent ? '✓' : '✗'}
                                        </div>
                                        <div className="text-sm text-gray-600 mt-1">{t('Upcoming Event')}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Other Languages */}
                            <div className="border-b pb-4">
                                <h3 className="text-lg font-semibold mb-3 text-gray-700">
                                    {t('Other Languages')}
                                </h3>
                                {selectedUserForProfile.otherLanguages && selectedUserForProfile.otherLanguages.length > 0
                                    ? (
                                            <div className="flex flex-wrap gap-2">
                                                {selectedUserForProfile.otherLanguages.map(lang => (
                                                    <span key={lang?.id || lang?.name} className="text-sm bg-gray-100 px-3 py-1.5 rounded-md">
                                                        {lang?.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )
                                    : (
                                            <span className="text-gray-400">{t('na')}</span>
                                        )}
                            </div>

                            {/* Partner Information */}
                            <div className="border-b pb-4">
                                <h3 className="text-lg font-semibold mb-3 text-gray-700">
                                    {t('Partner Information')}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Partner 1 */}
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <h4 className="font-semibold mb-2 text-blue-900">
                                            {t('Partner 1')}
                                        </h4>
                                        {selectedUserForProfile.partner1
                                            ? (
                                                    <div className="space-y-1 text-sm">
                                                        {selectedUserForProfile.partner1.gender && (
                                                            <div>
                                                                <strong>
                                                                    {t('Gender')}
                                                                    :
                                                                </strong>
                                                                {' '}
                                                                {selectedUserForProfile.partner1.gender}
                                                            </div>
                                                        )}
                                                        {selectedUserForProfile.partner1.dateOfBirth && (
                                                            <div>
                                                                <strong>
                                                                    {t('Age')}
                                                                    :
                                                                </strong>
                                                                {' '}
                                                                {new Date().getFullYear() - new Date(selectedUserForProfile.partner1.dateOfBirth).getFullYear()}
                                                            </div>
                                                        )}
                                                        {selectedUserForProfile.partner1.bio && (
                                                            <div>
                                                                <strong>
                                                                    {t('Bio')}
                                                                    :
                                                                </strong>
                                                                {' '}
                                                                {selectedUserForProfile.partner1.bio}
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            : (
                                                    <span className="text-gray-400">{t('na')}</span>
                                                )}
                                    </div>

                                    {/* Partner 2 */}
                                    <div className="bg-pink-50 p-4 rounded-lg">
                                        <h4 className="font-semibold mb-2 text-pink-900">
                                            {t('Partner 2')}
                                        </h4>
                                        {selectedUserForProfile.partner2 && selectedUserForProfile.accountType === 'COUPLE'
                                            ? (
                                                    <div className="space-y-1 text-sm">
                                                        {selectedUserForProfile.partner2.gender && (
                                                            <div>
                                                                <strong>
                                                                    {t('Gender')}
                                                                    :
                                                                </strong>
                                                                {' '}
                                                                {selectedUserForProfile.partner2.gender}
                                                            </div>
                                                        )}
                                                        {selectedUserForProfile.partner2.dateOfBirth && (
                                                            <div>
                                                                <strong>
                                                                    {t('Age')}
                                                                    :
                                                                </strong>
                                                                {' '}
                                                                {new Date().getFullYear() - new Date(selectedUserForProfile.partner2.dateOfBirth).getFullYear()}
                                                            </div>
                                                        )}
                                                        {selectedUserForProfile.partner2.bio && (
                                                            <div>
                                                                <strong>
                                                                    {t('Bio')}
                                                                    :
                                                                </strong>
                                                                {' '}
                                                                {selectedUserForProfile.partner2.bio}
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            : (
                                                    <span className="text-gray-400">{t('na')}</span>
                                                )}
                                    </div>
                                </div>
                            </div>

                            {/* Looking For */}
                            <div className="border-b pb-4">
                                <h3 className="text-lg font-semibold mb-3 text-gray-700">
                                    {t('Looking For')}
                                </h3>
                                {selectedUserForProfile.lookingFor && selectedUserForProfile.lookingFor.length > 0
                                    ? (
                                            <div className="flex flex-wrap gap-2">
                                                {selectedUserForProfile.lookingFor.map(tag => (
                                                    <span key={tag?.id} className="text-sm bg-blue-100 text-blue-800 px-3 py-1.5 rounded-md">
                                                        {tag?.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )
                                    : (
                                            <span className="text-gray-400">{t('na')}</span>
                                        )}
                            </div>

                            {/* Profile Purpose */}
                            <div className="border-b pb-4">
                                <h3 className="text-lg font-semibold mb-3 text-gray-700">
                                    {t('Profile Purpose')}
                                </h3>
                                {selectedUserForProfile.profilePurpose && selectedUserForProfile.profilePurpose.length > 0
                                    ? (
                                            <div className="flex flex-wrap gap-2">
                                                {selectedUserForProfile.profilePurpose.map(tag => (
                                                    <span key={tag?.id} className="text-sm bg-green-100 text-green-800 px-3 py-1.5 rounded-md">
                                                        {tag?.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )
                                    : (
                                            <span className="text-gray-400">{t('na')}</span>
                                        )}
                            </div>

                            {/* Willingness To Go */}
                            <div className="border-b pb-4">
                                <h3 className="text-lg font-semibold mb-3 text-gray-700">
                                    {t('Willingness To Go')}
                                </h3>
                                {selectedUserForProfile.willingnessToGo && selectedUserForProfile.willingnessToGo.length > 0
                                    ? (
                                            <div className="flex flex-wrap gap-2">
                                                {selectedUserForProfile.willingnessToGo.map(tag => (
                                                    <span key={tag?.id} className="text-sm bg-purple-100 text-purple-800 px-3 py-1.5 rounded-md">
                                                        {tag?.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )
                                    : (
                                            <span className="text-gray-400">{t('na')}</span>
                                        )}
                            </div>

                            {/* Rules of Engagement */}
                            <div className="border-b pb-4">
                                <h3 className="text-lg font-semibold mb-3 text-gray-700">
                                    {t('Rules of Engagement')}
                                </h3>
                                {selectedUserForProfile.rulesOfEngagement && selectedUserForProfile.rulesOfEngagement.length > 0
                                    ? (
                                            <div className="flex flex-wrap gap-2">
                                                {selectedUserForProfile.rulesOfEngagement.map(tag => (
                                                    <span key={tag?.id} className="text-sm bg-orange-100 text-orange-800 px-3 py-1.5 rounded-md">
                                                        {tag?.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )
                                    : (
                                            <span className="text-gray-400">{t('na')}</span>
                                        )}
                            </div>

                            {/* Settings */}
                            <div className="border-b pb-4">
                                <h3 className="text-lg font-semibold mb-3 text-gray-700">
                                    {t('Settings')}
                                </h3>
                                {selectedUserForProfile.settings
                                    ? (
                                            <div className="space-y-2 text-sm">
                                                {selectedUserForProfile.settings.timeFormat && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">⏰ Time Format:</span>
                                                        <span>{selectedUserForProfile.settings.timeFormat}</span>
                                                    </div>
                                                )}
                                                {selectedUserForProfile.settings.zoomLevel && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">🔍 Zoom Level:</span>
                                                        <span>{selectedUserForProfile.settings.zoomLevel}</span>
                                                    </div>
                                                )}
                                                {selectedUserForProfile.settings.notification && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">🔔 Notifications:</span>
                                                        <span>
                                                            {selectedUserForProfile.settings.notification.sound ? '🔊 Sound On' : '🔇 Sound Off'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    : (
                                            <span className="text-gray-400">{t('na')}</span>
                                        )}
                            </div>

                            {/* Inactivity Warnings */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3 text-gray-700">
                                    {t('Inactivity Warnings')}
                                </h3>
                                <div className="space-y-2">
                                    {selectedUserForProfile.inactivityDeletionWarning30SentAt && (
                                        <div className="bg-orange-50 p-3 rounded-md text-sm">
                                            <span className="font-medium text-orange-700">⚠️ 30-day warning:</span>
                                            {' '}
                                            {_formatDate(selectedUserForProfile.inactivityDeletionWarning30SentAt)}
                                        </div>
                                    )}
                                    {selectedUserForProfile.inactivityDeletionWarning10SentAt && (
                                        <div className="bg-red-50 p-3 rounded-md text-sm">
                                            <span className="font-medium text-red-700">⚠️ 10-day warning:</span>
                                            {' '}
                                            {_formatDate(selectedUserForProfile.inactivityDeletionWarning10SentAt)}
                                        </div>
                                    )}
                                    {!selectedUserForProfile.inactivityDeletionWarning30SentAt && !selectedUserForProfile.inactivityDeletionWarning10SentAt && (
                                        <span className="text-gray-400">{t('No warnings')}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end">
                            <Button
                                onClick={() => {
                                    setShowProfileModal(false);
                                    setSelectedUserForProfile(null);
                                }}
                            >
                                {t('Close')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
