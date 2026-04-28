import Confetti from 'react-confetti';

interface I_CelebrationOverlayProps {
    showConfetti: boolean;
    showMoneyImage: boolean;
    newPaidUsersCount: number;
    newPromoUsersCount: number;
}

export function CelebrationOverlay({ showConfetti, showMoneyImage, newPaidUsersCount, newPromoUsersCount }: I_CelebrationOverlayProps) {
    if (!showConfetti && !showMoneyImage) {
        return null;
    }

    return (
        <>
            {showConfetti && (
                <Confetti
                    width={window.innerWidth}
                    height={window.innerHeight}
                    recycle={false}
                    numberOfPieces={200}
                    gravity={0.1}
                    confettiSource={{ x: 0, y: 0, w: window.innerWidth, h: window.innerHeight }}
                />
            )}
            {showMoneyImage && (
                <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-50">
                    <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-slate-700/20">
                        <img
                            src="/images/money.gif"
                            alt="Money"
                            className="size-32 mb-4 animate-bounce mx-auto"
                        />
                        <p className="text-4xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent font-bold animate-pulse">
                            {newPaidUsersCount > 0 && (
                                <>
                                    +
                                    {newPaidUsersCount}
                                    {' '}
                                    Paid
                                    {' '}
                                    {newPaidUsersCount > 1 ? 'Users' : 'User'}
                                </>
                            )}
                            {newPaidUsersCount > 0 && newPromoUsersCount > 0 && ' & '}
                            {newPromoUsersCount > 0 && (
                                <>
                                    +
                                    {newPromoUsersCount}
                                    {' '}
                                    Promo
                                    {' '}
                                    {newPromoUsersCount > 1 ? 'Users' : 'User'}
                                </>
                            )}
                            ! 🎉
                        </p>
                        <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
                            {newPaidUsersCount > 0 ? 'Revenue increased!' : 'New members joined!'}
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
