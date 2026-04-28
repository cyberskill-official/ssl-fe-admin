import { Building, Edit, MapPin, Star, Trash2, Users } from 'lucide-react';
import { motion } from 'motion/react';

import { Badge, Button, Switch } from '#shared/component';

import type { I_DestinationCardProps } from './destination.type';

export function DestinationCard({
    destination,
    onEdit,
    onDelete,
    onToggleStatus,
    updatingStatusId,
    t,
}: I_DestinationCardProps) {
    const isActive = destination.isActive || false;
    const rating = destination.rating || 'SILVER';
    const type = destination.type || 'CLUB';
    const ageGroup = destination.ageGroup;

    const _getRatingColor = (rating: string) => {
        switch (rating) {
            case 'GOLD': return 'from-yellow-400 to-amber-500';
            case 'SILVER': return 'from-gray-300 to-gray-400';
            case 'BRONZE': return 'from-amber-600 to-orange-700';
            default: return 'from-gray-300 to-gray-400';
        }
    };

    const _getTypeColor = (type: string) => {
        switch (type) {
            case 'CLUB': return 'from-purple-400 to-pink-400';
            case 'RESORT': return 'from-blue-400 to-cyan-400';
            default: return 'from-gray-400 to-gray-600';
        }
    };

    const _getAverageRating = () => {
        const ratings = [
            destination.atmosphereRating?.rate || 0,
            destination.guestsRating?.rate || 0,
            destination.facilitiesRating?.rate || 0,
            destination.serviceRating?.rate || 0,
            destination.xFactorRating?.rate || 0,
        ];
        const average = ratings.reduce((sum, rate) => sum + rate, 0) / ratings.filter(rate => rate > 0).length;
        return average > 0 ? average.toFixed(1) : null;
    };

    const averageRating = _getAverageRating();

    return (
        <motion.div
            whileHover={{
                scale: 1.02,
                y: -4,
                transition: { duration: 0.2 },
            }}
            className="group relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-white/30 dark:border-gray-600/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
        >
            {/* Header with Image */}
            <div className="relative h-48 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30">
                {destination.logo
                    ? (
                            <img
                                src={destination.logo}
                                alt={destination.name || 'Destination'}
                                className="w-full h-full object-cover"
                            />
                        )
                    : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Building className="w-16 h-16 text-purple-400 dark:text-purple-300" />
                            </div>
                        )}
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                    <Badge
                        className={
                            isActive
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                        }
                    >
                        {isActive ? t('published') : t('draft')}
                    </Badge>
                </div>
                {/* Rating Badge */}
                <div className="absolute top-3 left-3">
                    <Badge className={`bg-gradient-to-r ${_getRatingColor(rating)} text-white text-xs`}>
                        {rating}
                    </Badge>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${_getTypeColor(type)}`}>
                        <Building className="h-4 w-4 text-white" />
                    </div>
                    <Badge variant="outline" className="text-xs border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 bg-white/50 dark:bg-gray-700/50">
                        {t(type?.toLowerCase() || 'club')}
                    </Badge>
                </div>

                {/* Destination Name */}
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm leading-tight line-clamp-2">
                    {destination.name}
                </h3>

                {/* Location */}
                <div className="flex items-center gap-2 mb-3 text-xs text-gray-600 dark:text-gray-300">
                    <MapPin className="w-3 h-3" />
                    <span className="line-clamp-1">
                        {destination.location?.city?.name || destination.location?.address || t('location-not-specified')}
                    </span>
                </div>

                {/* Age Group and Rating */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Users className="w-3 h-3 text-gray-500" />
                        <Badge variant="outline" className="text-xs">
                            {ageGroup?.replace('A', '').replace('_', '-') || '18-25'}
                        </Badge>
                    </div>
                    {averageRating && (
                        <div className="flex items-center gap-2">
                            <Star className="w-3 h-3 text-yellow-500" />
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                {averageRating}
                                /5
                            </span>
                        </div>
                    )}
                </div>

                {/* Created Info */}
                <div className="flex items-center justify-between mb-3 text-xs text-gray-600 dark:text-gray-300">
                    <div>
                        {t('created')}
                        :&nbsp;
                        {new Date(destination.createdAt).toLocaleDateString()}
                    </div>
                    {destination.createdBy?.username && (
                        <div>
                            {t('by')}
                            :&nbsp;
                            {destination.createdBy.username}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => onEdit(destination)}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    >
                        <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                        onClick={() => onDelete(destination)}
                        className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white"
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>

                {/* Status Toggle */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <Switch
                        checked={isActive}
                        onCheckedChange={() => onToggleStatus(destination.id!, isActive)}
                        aria-label={t('toggle-status')}
                        disabled={updatingStatusId === destination.id}
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                        {isActive ? t('published') : t('draft')}
                    </span>
                </div>
            </div>

            {/* Bottom Gradient Border */}
            <div className={`h-1 bg-gradient-to-r ${_getTypeColor(type)}`} />
        </motion.div>
    );
}
