'use client';

import { useEffect } from 'react';
import { useBranding } from '@/api/endpoints/setting';
import { buildBranding, DEFAULT_APPLE_ICON_PATH, DEFAULT_FAVICON_PATH } from '@/lib/branding';

function updateMetaContent(name: string, content: string) {
    const element = document.querySelector(`meta[name="${name}"]`);
    if (element) {
        element.setAttribute('content', content);
    }
}

function updateLinkHref(rel: string, href: string) {
    const element = document.querySelector(`link[rel="${rel}"]`);
    if (element) {
        element.setAttribute('href', href);
    }
}

export function BrandingSync() {
    const { data } = useBranding();
    const branding = buildBranding(data);

    useEffect(() => {
        document.title = branding.siteTitle;
        updateMetaContent('application-name', branding.siteTitle);
        updateMetaContent('apple-mobile-web-app-title', branding.siteTitle);
        updateMetaContent('mobile-web-app-title', branding.siteTitle);

        const iconHref = branding.siteLogoDataURL || DEFAULT_FAVICON_PATH;
        const appleIconHref = branding.siteLogoDataURL || DEFAULT_APPLE_ICON_PATH;
        updateLinkHref('icon', iconHref);
        updateLinkHref('apple-touch-icon', appleIconHref);
    }, [branding.siteLogoDataURL, branding.siteTitle]);

    return null;
}
