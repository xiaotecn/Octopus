import type { Branding } from '@/api/endpoints/setting';

export const DEFAULT_SITE_TITLE = 'Octopus';
export const DEFAULT_FAVICON_PATH = '/favicon.ico';
export const DEFAULT_APPLE_ICON_PATH = '/apple-icon.png';
export const DEFAULT_MANIFEST_PATH = '/manifest.json';
export const BRANDING_CACHE_KEY = 'octopus-branding';
export const DEFAULT_THEME_COLOR = '#EAE9E3';
export const DEFAULT_BACKGROUND_COLOR = '#EAE9E3';

export interface BrandingValue {
    siteTitle: string;
    siteLogoDataURL: string;
}

export interface BrandingCacheValue {
    site_title?: string;
    site_logo_data_url?: string;
}

export function buildBranding(data?: Partial<Branding> | null): BrandingValue {
    const siteTitle = data?.site_title?.trim() || DEFAULT_SITE_TITLE;
    const siteLogoDataURL = data?.site_logo_data_url?.trim() || '';

    return {
        siteTitle,
        siteLogoDataURL,
    };
}

export function toBrandingCacheValue(branding: BrandingValue): BrandingCacheValue {
    return {
        site_title: branding.siteTitle,
        site_logo_data_url: branding.siteLogoDataURL,
    };
}

export function buildBrandingManifest(siteTitle: string, siteLogoDataURL: string) {
    const trimmedTitle = siteTitle.trim() || DEFAULT_SITE_TITLE;
    const trimmedLogo = siteLogoDataURL.trim();
    const iconTypeMatch = trimmedLogo.match(/^data:(image\/[^;]+);/i);
    const iconType = iconTypeMatch?.[1] || 'image/png';

    return {
        name: trimmedTitle,
        short_name: trimmedTitle.slice(0, 12) || DEFAULT_SITE_TITLE,
        description: trimmedTitle,
        id: './',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'any',
        theme_color: DEFAULT_THEME_COLOR,
        background_color: DEFAULT_BACKGROUND_COLOR,
        icons: trimmedLogo
            ? [
                {
                    src: trimmedLogo,
                    sizes: '512x512',
                    type: iconType,
                    purpose: 'any',
                },
                {
                    src: trimmedLogo,
                    sizes: '512x512',
                    type: iconType,
                    purpose: 'maskable',
                },
            ]
            : [],
    };
}
