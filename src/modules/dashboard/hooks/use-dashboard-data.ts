import { Activity, Shield, Target, TrendingUp, Users } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useSmartPolling } from '#shared/hooks';

import { useGetAdvertisements } from '../../advertisement/advertisement.hook';
import { useGetBlogs } from '../../blog/blog.hook';
import { useGetDestinations } from '../../destination/destination.hook';
import { useGetUsers } from '../../user/user.hook';
import { DASHBOARD_CONSTANTS } from '../dashboard.constants';

export function useDashboardData() {
    const [newPaidUsersCount, setNewPaidUsersCount] = useState(0);
    const [newPromoUsersCount, setNewPromoUsersCount] = useState(0);
    const [showConfetti, setShowConfetti] = useState(false);
    const [showMoneyImage, setShowMoneyImage] = useState(false);

    const previousPayingUsersRef = useRef<number>(0);
    const previousPromoUsersRef = useRef<number>(0);
    const accumulatedDeltaRef = useRef<number>(0);
    const accumulatedPromoDeltaRef = useRef<number>(0);
    const resetTimerRef = useRef<NodeJS.Timeout | null>(null);
    const resetPromoTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch all users with roles populated to count paid/promo client-side
    const { users: allUsers, totalDocs: totalUsers, loading: allUsersLoading, refetch: refetchAllUsers } = useGetUsers(
        { isDel: false },
        { page: 1, limit: 5000, populate: ['roles'] },
    );

    // Fetch recent users (sorted by newest) for the tasks section only
    const { users: recentUsersList, loading: recentUsersLoading, refetch: refetchRecentUsers } = useGetUsers(
        { isDel: false },
        { page: 1, limit: 50, sort: { createdAt: -1 } },
    );

    // Fetch total blocked users
    const { totalDocs: blockedUsersCount, loading: blockedUsersLoading, refetch: refetchBlockedUsers } = useGetUsers(
        { isAdminBlocked: true },
        { limit: 0 },
    );

    const { paidUsersCount, promoUsersCount } = useMemo(() => {
        let paid = 0;
        let promo = 0;
        for (const user of allUsers) {
            const hasPaid = user?.roles?.some(role => role?.name === 'PAID_MEMBER');
            const hasPromo = user?.roles?.some(role => role?.name === 'PROMO_MEMBER');
            if (hasPaid)
                paid++;
            if (hasPromo)
                promo++;
        }
        return { paidUsersCount: paid, promoUsersCount: promo };
    }, [allUsers]);

    const usersLoading = allUsersLoading || recentUsersLoading;

    const { advertisements, totalDocs: totalAds, loading: adsLoading, refetch: refetchAds } = useGetAdvertisements(
        {},
        { page: DASHBOARD_CONSTANTS.PAGINATION.DEFAULT_PAGE, limit: DASHBOARD_CONSTANTS.PAGINATION.DEFAULT_LIMIT },
    );

    const { blogs: _blogs, totalDocs: totalBlogs, loading: blogsLoading, refetch: refetchBlogs } = useGetBlogs(
        {},
        { page: DASHBOARD_CONSTANTS.PAGINATION.DEFAULT_PAGE, limit: DASHBOARD_CONSTANTS.PAGINATION.DEFAULT_LIMIT },
    );

    const { destinations: _destinations, totalDocs: totalDestinations, loading: destinationsLoading, refetch: refetchDestinations } = useGetDestinations(
        {},
        { page: DASHBOARD_CONSTANTS.PAGINATION.DEFAULT_PAGE, limit: DASHBOARD_CONSTANTS.PAGINATION.DEFAULT_LIMIT },
    );


    useSmartPolling(() => {
        refetchAllUsers?.();
        refetchRecentUsers?.();
        refetchBlockedUsers?.();
        refetchAds?.();
        refetchBlogs?.();
        refetchDestinations?.();
    }, DASHBOARD_CONSTANTS.POLLING_INTERVAL);

    const activeAdsCount = useMemo(() => {
        return advertisements.filter(ad => ad.isActive).length;
    }, [advertisements]);

    useEffect(() => {
        if (usersLoading) {
            return;
        }

        const currentPayingUsers = paidUsersCount;

        if (previousPayingUsersRef.current > 0 && currentPayingUsers > previousPayingUsersRef.current) {
            const delta = currentPayingUsers - previousPayingUsersRef.current;

            accumulatedDeltaRef.current += delta;

            // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
            setNewPaidUsersCount(accumulatedDeltaRef.current);

            queueMicrotask(() => {
                setShowConfetti(true);
                setShowMoneyImage(true);
            });

            if (resetTimerRef.current) {
                clearTimeout(resetTimerRef.current);
            }

            resetTimerRef.current = setTimeout(() => {
                accumulatedDeltaRef.current = 0;
                setNewPaidUsersCount(0);
                setShowConfetti(false);
                setShowMoneyImage(false);
                resetTimerRef.current = null;
            }, DASHBOARD_CONSTANTS.ANIMATION.RESET_DELAY);

            const confettiTimer = setTimeout(() => {
                setShowConfetti(false);
            }, DASHBOARD_CONSTANTS.ANIMATION.CONFETTI_DURATION);

            const imageTimer = setTimeout(() => {
                setShowMoneyImage(false);
            }, DASHBOARD_CONSTANTS.ANIMATION.MONEY_IMAGE_DURATION);

            return () => {
                clearTimeout(confettiTimer);
                clearTimeout(imageTimer);
            };
        }
        previousPayingUsersRef.current = currentPayingUsers;
    }, [paidUsersCount, usersLoading]);

    useEffect(() => {
        if (usersLoading) {
            return;
        }

        const currentPromoUsers = promoUsersCount;

        if (previousPromoUsersRef.current > 0 && currentPromoUsers > previousPromoUsersRef.current) {
            const delta = currentPromoUsers - previousPromoUsersRef.current;

            accumulatedPromoDeltaRef.current += delta;

            // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
            setNewPromoUsersCount(accumulatedPromoDeltaRef.current);

            if (resetPromoTimerRef.current) {
                clearTimeout(resetPromoTimerRef.current);
            }

            resetPromoTimerRef.current = setTimeout(() => {
                accumulatedPromoDeltaRef.current = 0;
                setNewPromoUsersCount(0);
                resetPromoTimerRef.current = null;
            }, DASHBOARD_CONSTANTS.ANIMATION.RESET_DELAY);
        }
        previousPromoUsersRef.current = currentPromoUsers;
    }, [promoUsersCount, usersLoading]);

    const stats = useMemo(() => {
        const paidUsers = paidUsersCount;
        const promoUsers = promoUsersCount;
        const totalPayingUsers = paidUsers + promoUsers;
        const freeUsers = totalUsers - totalPayingUsers;
        const activeAds = activeAdsCount;

        return [
            {
                id: '1',
                title: 'Paid Members',
                value: paidUsers.toLocaleString(),
                change: usersLoading ? '...' : `${paidUsers} users`,
                subtitle: 'Paying subscribers',
                icon: Users,
                color: 'text-purple-600',
                bgColor: 'bg-gradient-to-r from-purple-100 to-pink-100',
                gradient: 'from-purple-600 to-pink-600',
                trend: 'up' as const,
                loading: usersLoading,
                percentage: totalUsers > 0 ? (paidUsers / totalUsers) * 100 : 0,
            },
            {
                id: '2',
                title: 'Promo Members',
                value: promoUsers.toLocaleString(),
                change: usersLoading ? '...' : `${promoUsers} users`,
                subtitle: 'Promotional members',
                icon: Users,
                color: 'text-orange-600',
                bgColor: 'bg-gradient-to-r from-orange-100 to-amber-100',
                gradient: 'from-orange-600 to-amber-600',
                trend: 'up' as const,
                loading: usersLoading,
                percentage: totalUsers > 0 ? (promoUsers / totalUsers) * 100 : 0,
            },
            {
                id: '3',
                title: 'Free Users',
                value: freeUsers.toLocaleString(),
                change: usersLoading ? '...' : `${freeUsers} users`,
                subtitle: 'Total registered free users',
                icon: Users,
                color: 'text-blue-600',
                bgColor: 'bg-gradient-to-r from-blue-100 to-cyan-100',
                gradient: 'from-blue-600 to-cyan-600',
                trend: 'up' as const,
                loading: usersLoading,
                percentage: totalUsers > 0 ? (freeUsers / totalUsers) * 100 : 0,
            },
            {
                id: '4',
                title: 'Active Ads',
                value: activeAds.toString(),
                change: adsLoading ? '...' : `${totalAds} total`,
                subtitle: 'Currently running advertisements',
                icon: TrendingUp,
                color: 'text-emerald-600',
                bgColor: 'bg-gradient-to-r from-emerald-100 to-teal-100',
                gradient: 'from-emerald-600 to-teal-600',
                trend: 'up' as const,
                loading: adsLoading,
                percentage: totalAds > 0 ? (activeAds / totalAds) * 100 : 50,
            },
            {
                id: '5',
                title: 'Total Users',
                value: totalUsers.toLocaleString(),
                change: usersLoading || blockedUsersLoading ? '...' : `${blockedUsersCount} blocked`,
                subtitle: 'Total registered users',
                icon: Users,
                color: 'text-amber-600',
                bgColor: 'bg-gradient-to-r from-amber-100 to-orange-100',
                gradient: 'from-amber-600 to-orange-600',
                trend: 'up' as const,
                loading: usersLoading || blockedUsersLoading,
                percentage: 100,
            },
            {
                id: '6',
                title: 'Blog Posts',
                value: totalBlogs.toString(),
                change: blogsLoading ? '...' : 'Published',
                subtitle: 'Total blog content',
                icon: Activity,
                color: 'text-indigo-600',
                bgColor: 'bg-gradient-to-r from-indigo-100 to-purple-100',
                gradient: 'from-indigo-600 to-purple-600',
                trend: 'up' as const,
                loading: blogsLoading,
                percentage: totalBlogs > 0 ? Math.min(100, totalBlogs * 10) : 10,
            },
            {
                id: '7',
                title: 'Destinations',
                value: totalDestinations.toString(),
                change: destinationsLoading ? '...' : 'Total',
                subtitle: 'Travel destinations',
                icon: Target,
                color: 'text-green-600',
                bgColor: 'bg-gradient-to-r from-green-100 to-emerald-100',
                gradient: 'from-green-600 to-emerald-600',
                trend: 'up' as const,
                loading: destinationsLoading,
                percentage: totalDestinations > 0 ? Math.min(100, totalDestinations * 5) : 10,
            },
            {
                id: '8',
                title: 'Conversion Rate',
                value: totalUsers > 0 ? `${((totalPayingUsers / totalUsers) * 100).toFixed(1)}%` : '0%',
                change: usersLoading ? '...' : 'Free to paid',
                subtitle: 'User conversion rate',
                icon: TrendingUp,
                color: 'text-teal-600',
                bgColor: 'bg-gradient-to-r from-teal-100 to-cyan-100',
                gradient: 'from-teal-600 to-cyan-600',
                trend: 'up' as const,
                loading: usersLoading,
                percentage: totalUsers > 0 ? (totalPayingUsers / totalUsers) * 100 : 0,
            },
        ];
    }, [paidUsersCount, promoUsersCount, blockedUsersCount, totalUsers, activeAdsCount, totalAds, totalBlogs, totalDestinations, usersLoading, blockedUsersLoading, adsLoading, blogsLoading, destinationsLoading]);

    const tasks = useMemo(() => {
        const now = new Date();
        const today = now.toLocaleDateString();
        const nowTime = now.getTime();
        const recentUsers = recentUsersList.filter((user) => {
            if (!user.createdAt) {
                return false;
            }
            const created = new Date(user.createdAt);
            const daysDiff = (nowTime - created.getTime()) / (1000 * 60 * 60 * 24);
            return daysDiff <= 7;
        }).length;

        const activeAds = activeAdsCount;

        return [
            {
                id: '1',
                title: `Review ${recentUsers} new user registrations`,
                lastUpdated: today,
                status: usersLoading ? 'Loading...' : recentUsers > 0 ? 'Open' : 'No Action',
                priority: recentUsers > 5 ? 'High' : 'Low',
                assignee: 'Admin',
                statusColor: recentUsers > 0
                    ? 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800'
                    : 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800',
                priorityColor: recentUsers > 5
                    ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800'
                    : 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800',
                icon: Shield,
            },
            {
                id: '2',
                title: `Manage ${activeAds} active advertisements`,
                lastUpdated: today,
                status: adsLoading ? 'Loading...' : activeAds > 0 ? 'In progress' : 'Complete',
                priority: activeAds > 3 ? 'High' : 'Medium',
                assignee: 'Marketing',
                statusColor: activeAds > 0
                    ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800'
                    : 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800',
                priorityColor: activeAds > 3
                    ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800'
                    : 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800',
                icon: Target,
            },
            {
                id: '3',
                title: `Review ${totalBlogs} blog posts`,
                lastUpdated: today,
                status: blogsLoading ? 'Loading...' : totalBlogs > 0 ? 'Open' : 'No Content',
                priority: totalBlogs > 10 ? 'Medium' : 'Low',
                assignee: 'Content Team',
                statusColor: totalBlogs > 0
                    ? 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800'
                    : 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800',
                priorityColor: totalBlogs > 10
                    ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800'
                    : 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800',
                icon: Activity,
            },
            {
                id: '4',
                title: `Monitor ${totalDestinations} destinations`,
                lastUpdated: today,
                status: destinationsLoading ? 'Loading...' : totalDestinations > 0 ? 'Active' : 'Setup Required',
                priority: totalDestinations < 5 ? 'High' : 'Low',
                assignee: 'Content Team',
                statusColor: totalDestinations > 0
                    ? 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800'
                    : 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800',
                priorityColor: totalDestinations < 5
                    ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800'
                    : 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800',
                icon: Target,
            },
        ];
    }, [recentUsersList, activeAdsCount, totalBlogs, totalDestinations, usersLoading, adsLoading, blogsLoading, destinationsLoading]);

    return {
        stats,
        tasks,
        showConfetti,
        showMoneyImage,
        newPaidUsersCount,
        newPromoUsersCount,
        counts: {
            totalUsers,
            activeAdsCount,
            totalAds,
            totalBlogs,
            totalDestinations,
            paidUsersCount,
            promoUsersCount,
        },
        loading: {
            usersLoading,
            adsLoading,
            blogsLoading,
            destinationsLoading,
        },
    };
}
