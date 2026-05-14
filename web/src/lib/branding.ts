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

export function buildBrandingManifest(siteTitle: string, siteLogoDataURL: string, origin = '') {
    const trimmedTitle = siteTitle.trim() || DEFAULT_SITE_TITLE;
    const trimmedLogo = siteLogoDataURL.trim();
    const iconTypeMatch = trimmedLogo.match(/^data:(image\/[^;]+);/i);
    const iconType = iconTypeMatch?.[1] || 'image/png';
    const baseOrigin = origin.trim().replace(/\/$/, '');
    const toAbsolute = (path: string) =>
        baseOrigin ? `${baseOrigin}${path.startsWith('/') ? path : `/${path}`}` : path;
    const fallbackIcon192 = toAbsolute('/web-app-manifest-192x192.png');
    const fallbackIcon512 = toAbsolute('/web-app-manifest-512x512.png');
    const iconSrc = trimmedLogo || fallbackIcon512;

    return {
        name: trimmedTitle,
        short_name: trimmedTitle.slice(0, 12) || DEFAULT_SITE_TITLE,
        description: trimmedTitle,
        id: baseOrigin || '/',
        start_url: toAbsolute('/'),
        scope: toAbsolute('/'),
        lang: 'zh-CN',
        dir: 'ltr',
        display: 'standalone',
        orientation: 'any',
        theme_color: DEFAULT_THEME_COLOR,
        background_color: DEFAULT_BACKGROUND_COLOR,
        categories: ['utilities', 'productivity', 'developer tools'],
        icons: [
            {
                src: trimmedLogo || fallbackIcon192,
                sizes: '192x192',
                type: trimmedLogo ? iconType : 'image/png',
                purpose: 'any',
            },
            {
                src: iconSrc,
                sizes: '512x512',
                type: trimmedLogo ? iconType : 'image/png',
                purpose: 'any',
            },
            {
                src: iconSrc,
                sizes: '512x512',
                type: trimmedLogo ? iconType : 'image/png',
                purpose: 'maskable',
            },
        ],
    };
}
