import type { E_SocialPlatform } from '#shared/graphql';

export interface I_SocialLinkRow_Props {
    id: number;
    platform: { id: string; type: E_SocialPlatform | null; url: string };
    selectedPlatforms: E_SocialPlatform[];
    onChange: (field: 'type' | 'url', value: string) => void;
    onRemove: () => void;
}
