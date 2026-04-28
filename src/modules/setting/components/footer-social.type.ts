import type { E_SocialPlatform } from '#shared/graphql';

export interface I_Platform {
    id: string;
    type: E_SocialPlatform | null;
    url: string;
}
