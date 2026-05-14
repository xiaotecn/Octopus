import { NextResponse } from 'next/server';
import { buildBrandingManifest, DEFAULT_SITE_TITLE } from '@/lib/branding';

export const dynamic = 'force-dynamic';

type BrandingPayload = {
    site_title?: string;
    site_logo_data_url?: string;
};

function extractBrandingPayload(payload: unknown): BrandingPayload {
    if (payload && typeof payload === 'object' && 'data' in payload) {
        const nested = (payload as { data?: BrandingPayload }).data;
        if (nested && typeof nested === 'object') {
            return nested;
        }
    }
    if (payload && typeof payload === 'object') {
        return payload as BrandingPayload;
    }
    return {};
}

export async function GET(request: Request) {
    const origin = new URL(request.url).origin;

    let branding: BrandingPayload = {};
    try {
        const response = await fetch(`${origin}/api/v1/setting/branding`, {
            cache: 'no-store',
        });
        if (response.ok) {
            branding = extractBrandingPayload(await response.json());
        }
    } catch {
        branding = {};
    }

    const manifest = buildBrandingManifest(
        branding.site_title ?? DEFAULT_SITE_TITLE,
        branding.site_logo_data_url ?? '',
    );

    return NextResponse.json(manifest, {
        headers: {
            'Content-Type': 'application/manifest+json; charset=utf-8',
            'Cache-Control': 'no-store',
        },
    });
}
