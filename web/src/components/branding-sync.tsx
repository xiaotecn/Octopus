'use client';

import { useEffect, useRef } from 'react';
import { useBranding } from '@/api/endpoints/setting';
import {
    BRANDING_CACHE_KEY,
    buildBranding,
    buildBrandingManifest,
    DEFAULT_APPLE_ICON_PATH,
    DEFAULT_FAVICON_PATH,
    DEFAULT_MANIFEST_PATH,
    toBrandingCacheValue,
} from '@/lib/branding';

function updateMetaContent(name: string, content: string) {
    const element = document.querySelector(`meta[name="${name}"]`);
    if (element) {
        element.setAttribute('content', content);
    }
}

function ensureLink(rel: string) {
    let element = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
    if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
    }
    return element;
}

function syncFavicons(href: string, appleHref: string) {
    const icon = ensureLink('icon');
    icon.setAttribute('href', href);
    icon.setAttribute('sizes', 'any');

    const shortcutIcon = ensureLink('shortcut icon');
    shortcutIcon.setAttribute('href', href);

    const appleTouchIcon = ensureLink('apple-touch-icon');
    appleTouchIcon.setAttribute('href', appleHref);
}

function syncManifest(href: string) {
    const manifest = ensureLink('manifest');
    manifest.setAttribute('href', href);
}

export function BrandingSync() {
    const { data } = useBranding();
    const branding = buildBranding(data);
    const manifestUrlRef = useRef<string | null>(null);

    useEffect(() => {
        if (!data) {
            return;
        }

        document.title = branding.siteTitle;
        updateMetaContent('application-name', branding.siteTitle);
        updateMetaContent('apple-mobile-web-app-title', branding.siteTitle);
        updateMetaContent('mobile-web-app-title', branding.siteTitle);

        const iconHref = branding.siteLogoDataURL || DEFAULT_FAVICON_PATH;
        const appleIconHref = branding.siteLogoDataURL || DEFAULT_APPLE_ICON_PATH;
        syncFavicons(iconHref, appleIconHref);
        if (manifestUrlRef.current) {
            URL.revokeObjectURL(manifestUrlRef.current);
            manifestUrlRef.current = null;
        }
        const manifestBlob = new Blob(
            [JSON.stringify(buildBrandingManifest(branding.siteTitle, branding.siteLogoDataURL))],
            { type: 'application/manifest+json' },
        );
        const manifestUrl = URL.createObjectURL(manifestBlob);
        manifestUrlRef.current = manifestUrl;
        syncManifest(manifestUrl);

        try {
            const payload = JSON.stringify(toBrandingCacheValue(branding));
            localStorage.setItem(BRANDING_CACHE_KEY, payload);
        } catch {
            // Ignore storage failures (e.g. private mode / quota)
        }

        return () => {
            if (manifestUrlRef.current) {
                URL.revokeObjectURL(manifestUrlRef.current);
                manifestUrlRef.current = null;
            }
        };
    }, [data, branding.siteLogoDataURL, branding.siteTitle]);

    return null;
}
