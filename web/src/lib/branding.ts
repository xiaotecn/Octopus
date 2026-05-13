import type { Branding } from '@/api/endpoints/setting';

export const DEFAULT_SITE_TITLE = 'Octopus';
export const DEFAULT_FAVICON_PATH = '/favicon.ico';
export const DEFAULT_APPLE_ICON_PATH = '/apple-icon.png';

export interface BrandingValue {
    siteTitle: string;
    siteLogoDataURL: string;
}

export function buildBranding(data?: Partial<Branding> | null): BrandingValue {
    const siteTitle = data?.site_title?.trim() || DEFAULT_SITE_TITLE;
    const siteLogoDataURL = data?.site_logo_data_url?.trim() || '';

    return {
        siteTitle,
        siteLogoDataURL,
    };
}
