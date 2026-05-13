import type { Branding } from '@/api/endpoints/setting';

export const DEFAULT_SITE_TITLE = 'Octopus';
export const DEFAULT_FAVICON_PATH = '/favicon.ico';
export const DEFAULT_APPLE_ICON_PATH = '/apple-icon.png';
export const BRANDING_CACHE_KEY = 'octopus-branding';

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
