import { motion } from 'motion/react';

interface MediaStatsCardsProps {
    stats: {
        pending: number;
        approved: number;
        rejected: number;
        total: number;
    };
}

export function MediaStatsCards({ stats }: MediaStatsCardsProps) {
    return (
        <div className="flex gap-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-xl shadow-lg"
            >
                <div className="text-2xl font-bold">{stats.pending}</div>
                <div className="text-sm opacity-90">Pending</div>
            </motion.div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-4 py-2 rounded-xl shadow-lg"
            >
                <div className="text-2xl font-bold">{stats.approved}</div>
                <div className="text-sm opacity-90">Approved</div>
            </motion.div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-r from-red-400 to-pink-500 text-white px-4 py-2 rounded-xl shadow-lg"
            >
                <div className="text-2xl font-bold">{stats.rejected}</div>
                <div className="text-sm opacity-90">Rejected</div>
            </motion.div>
        </div>
    );
}
