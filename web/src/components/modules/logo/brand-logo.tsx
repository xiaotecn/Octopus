'use client';

import { useBranding } from '@/api/endpoints/setting';
import { buildBranding, DEFAULT_FAVICON_PATH } from '@/lib/branding';
import { cn } from '@/lib/utils';
import Logo from '.';

interface BrandLogoProps {
    size?: number | string;
    animate?: boolean;
    className?: string;
    alt?: string;
}

export default function BrandLogo({
    size = 48,
    animate = false,
    className,
    alt,
}: BrandLogoProps) {
    const { data } = useBranding();
    const branding = buildBranding(data);
    const sizeStyle = size === '100%' ? { width: '100%', height: '100%' } : { width: size, height: size };

    if (!animate && branding.siteLogoDataURL) {
        return (
            <img
                src={branding.siteLogoDataURL}
                alt={alt || branding.siteTitle}
                style={sizeStyle}
                className={cn('shrink-0 object-contain', className)}
            />
        );
    }

    if (!animate) {
        return (
            <img
                src={DEFAULT_FAVICON_PATH}
                alt={alt || branding.siteTitle}
                style={sizeStyle}
                className={cn('shrink-0 object-contain', className)}
            />
        );
    }

    return <Logo size={size} animate={animate} />;
}
