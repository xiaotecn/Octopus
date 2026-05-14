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
    const fallbackIcon192 = './web-app-manifest-192x192.png';
    const fallbackIcon512 = './web-app-manifest-512x512.png';
    const iconSrc = trimmedLogo || fallbackIcon512;
    const shortcutIconSrc = trimmedLogo || fallbackIcon192;

    return {
        name: trimmedTitle,
        short_name: trimmedTitle.slice(0, 12) || DEFAULT_SITE_TITLE,
        description: trimmedTitle,
        id: './',
        start_url: './',
        scope: './',
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
        screenshots: [
            {
                src: './screenshot/desktop-home.png',
                sizes: '1437x918',
                type: 'image/png',
                form_factor: 'wide',
                label: '首页仪表盘',
            },
            {
                src: './screenshot/desktop-channel.png',
                sizes: '1437x918',
                type: 'image/png',
                form_factor: 'wide',
                label: '渠道管理',
            },
            {
                src: './screenshot/mobile-home.png',
                sizes: '1290x2796',
                type: 'image/png',
                form_factor: 'narrow',
                label: '移动端首页',
            },
            {
                src: './screenshot/mobile-channel.png',
                sizes: '1290x2796',
                type: 'image/png',
                form_factor: 'narrow',
                label: '移动端渠道',
            },
        ],
        shortcuts: [
            {
                name: '渠道管理',
                short_name: '渠道',
                url: './',
                icons: [
                    {
                        src: shortcutIconSrc,
                        sizes: '192x192',
                        type: trimmedLogo ? iconType : 'image/png',
                    },
                ],
            },
            {
                name: '模型价格管理',
                short_name: '价格',
                url: './',
                icons: [
                    {
                        src: shortcutIconSrc,
                        sizes: '192x192',
                        type: trimmedLogo ? iconType : 'image/png',
                    },
                ],
            },
            {
                name: '分组管理',
                short_name: '分组',
                url: './',
                icons: [
                    {
                        src: shortcutIconSrc,
                        sizes: '192x192',
                        type: trimmedLogo ? iconType : 'image/png',
                    },
                ],
            },
        ],
    };
}
