import type { RouteConfig } from '@react-router/dev/routes';

import { index, layout, prefix, route } from '@react-router/dev/routes';

// https://reactrouter.com/start/framework/routing
export default [
    layout('./shared/layout/blank/index.tsx', [
        ...prefix('auth', [route('login', './modules/authn/login/login.page.tsx')]),
        route('forbidden', './modules/error/403.page.tsx'),
    ]),
    layout('./shared/layout/dashboard/index.tsx', [
        ...prefix('', [
            index('./modules/dashboard/dashboard.page.tsx'),
            route('message', './modules/message/message.page.tsx'),
            route('push-chat', './modules/push-chat/push-chat.page.tsx'),
            route('blog', './modules/blog/blog.page.tsx'),
            ...prefix('moderation', [
                // index('./modules/moderation/moderation-dashboard/moderation-dashboard.page.tsx'),
                route('age-verification', './modules/moderation/age-verification/age-verification.page.tsx'),
                route('keyword', './modules/moderation/keyword/keyword.page.tsx'),
                route('media', './modules/moderation/media/media.page.tsx'),
                route('log', './modules/moderation/log/log.page.tsx'),
                route('report', './modules/moderation/report/report.page.tsx'),
                route('ai', './modules/moderation/ai/ai.page.tsx'),
                route('dashboard', './modules/moderation/dashboard/dashboard.page.tsx'),
            ]),
            route('advertisement', './modules/advertisement/advertisement.page.tsx'),
            route('promo-code', './modules/promo-code/promo-code.page.tsx'),
            route('legal-document', './modules/legal-document/legal-document.page.tsx'),
            route('admin-control', './modules/authz/authz.page.tsx'),
            route('auto-email', './modules/email-template/email-template.page.tsx'),
            route('destination', './modules/destination/destination.page.tsx'),
            route('email-campaign', './modules/email-campaign/email-campaign.page.tsx'),
            route('pricing', './modules/pricing/pricing.page.tsx'),
            route('payments', './modules/payment-audit/payment-audit.page.tsx'),
            route('tag', './modules/tag/tag.page.tsx'),
            route('catalogue', './modules/catalogue/catalogue.page.tsx'),
            route('settings', './modules/setting/setting.page.tsx'),
            route('editor-demo', './routes/editor-demo.tsx'),
        ]),
    ]),
    // * matches all URLs, the ? makes it optional so it will match / as well
    route('*?', './modules/error/404.page.tsx'),
] satisfies RouteConfig;
