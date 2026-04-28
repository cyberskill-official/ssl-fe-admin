import { Settings } from 'lucide-react';
import { useEffect } from 'react';

import { useTranslate } from '#shared/i18n';
import { usePortal } from '#shared/portal';

import { AdminNotificationsSection, FAQSection, FooterSocialSection } from './components';

function SettingPage() {
    const { t } = useTranslate('settings');
    const { setHeader } = usePortal();

    useEffect(() => {
        setHeader({
            title: t('title'),
            description: t('subtitle'),
            icon: Settings,
        });
        return () => setHeader(null);
    }, [setHeader, t]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 space-y-6">
            {/* Footer Social Media Section */}
            <div className="transform hover:scale-[1.01] transition-all duration-300">
                <FooterSocialSection />
            </div>

            {/* Admin Notifications Section */}
            <div className="transform hover:scale-[1.01] transition-all duration-300">
                <AdminNotificationsSection />
            </div>

            {/* FAQ Section */}
            <div className="transform hover:scale-[1.01] transition-all duration-300">
                <FAQSection />
            </div>
        </div>
    );
}

export default SettingPage;
