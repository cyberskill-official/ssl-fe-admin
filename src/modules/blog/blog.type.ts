import type { E_SocialPlatform, Input_CreateBlog } from '#shared/graphql';

export interface I_BlogSocialLink {
    id: string;
    type: E_SocialPlatform | null;
    url: string;
}

export interface I_BlogSocialLinksProps {
    socialLinks?: Input_CreateBlog['socialLinks'];
    onSocialLinksChange: (socialLinks: I_BlogSocialLink[]) => void;
}

export interface I_BlogPreviewProps {
    formData: Input_CreateBlog;
    t: (key: string, params?: Record<string, any>) => string;
}
