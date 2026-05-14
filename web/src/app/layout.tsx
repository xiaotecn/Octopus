import "./globals.css";
import Script from "next/script";
import { ThemeProvider } from "@/provider/theme";
import { Toaster } from "@/components/ui/sonner";
import { LocaleProvider } from "@/provider/locale";
import QueryProvider from "@/provider/query";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { TooltipProvider } from "@/components/animate-ui/components/animate/tooltip";
import { BrandingSync } from "@/components/branding-sync";
import {
  BRANDING_CACHE_KEY,
  DEFAULT_APPLE_ICON_PATH,
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_FAVICON_PATH,
  DEFAULT_MANIFEST_PATH,
  DEFAULT_SITE_TITLE,
  DEFAULT_THEME_COLOR,
} from "@/lib/branding";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const brandingBootstrapScript = `
    (() => {
      const cacheKey = ${JSON.stringify(BRANDING_CACHE_KEY)};
      const defaultSiteTitle = ${JSON.stringify(DEFAULT_SITE_TITLE)};
      const defaultFaviconPath = ${JSON.stringify(DEFAULT_FAVICON_PATH)};
      const defaultAppleIconPath = ${JSON.stringify(DEFAULT_APPLE_ICON_PATH)};
      const defaultManifestPath = ${JSON.stringify(DEFAULT_MANIFEST_PATH)};
      const defaultThemeColor = ${JSON.stringify(DEFAULT_THEME_COLOR)};
      const defaultBackgroundColor = ${JSON.stringify(DEFAULT_BACKGROUND_COLOR)};

      const safeTrim = (value) => (typeof value === 'string' ? value.trim() : '');
      const setMetaContent = (name, content) => {
        const element = document.querySelector('meta[name="' + name + '"]');
        if (element) element.setAttribute('content', content);
      };
      const ensureLink = (rel) => {
        let element = document.head.querySelector('link[rel="' + rel + '"]');
        if (!element) {
          element = document.createElement('link');
          element.setAttribute('rel', rel);
          document.head.appendChild(element);
        }
        return element;
      };
      const syncFavicons = (href, appleHref) => {
        const icon = ensureLink('icon');
        icon.setAttribute('href', href);
        icon.setAttribute('sizes', 'any');

        const shortcutIcon = ensureLink('shortcut icon');
        shortcutIcon.setAttribute('href', href);

        const appleTouchIcon = ensureLink('apple-touch-icon');
        appleTouchIcon.setAttribute('href', appleHref);
      };
      const buildManifestObject = (siteTitle, siteLogoDataURL) => {
        const iconTypeMatch = siteLogoDataURL.match(/^data:(image\\/[^;]+);/i);
        const iconType = iconTypeMatch ? iconTypeMatch[1] : 'image/png';
        return {
          name: siteTitle,
          short_name: (siteTitle || defaultSiteTitle).slice(0, 12) || defaultSiteTitle,
          description: siteTitle,
          id: './',
          start_url: './',
          scope: './',
          display: 'standalone',
          orientation: 'any',
          theme_color: defaultThemeColor,
          background_color: defaultBackgroundColor,
          icons: siteLogoDataURL ? [
            { src: siteLogoDataURL, sizes: '512x512', type: iconType, purpose: 'any' },
            { src: siteLogoDataURL, sizes: '512x512', type: iconType, purpose: 'maskable' }
          ] : []
        };
      };
      const syncManifest = (siteTitle, siteLogoDataURL) => {
        const manifest = ensureLink('manifest');
        const prevHref = manifest.getAttribute('href') || '';
        if (siteLogoDataURL) {
          if (prevHref.startsWith('blob:')) {
            try { URL.revokeObjectURL(prevHref); } catch {}
          }
          const blob = new Blob(
            [JSON.stringify(buildManifestObject(siteTitle, siteLogoDataURL))],
            { type: 'application/manifest+json' }
          );
          manifest.setAttribute('href', URL.createObjectURL(blob));
        } else {
          manifest.setAttribute('href', defaultManifestPath);
        }
      };

      try {
        const raw = localStorage.getItem(cacheKey);
        if (!raw) return;

        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return;

        const siteTitle = safeTrim(parsed.site_title) || defaultSiteTitle;
        const siteLogoDataURL = safeTrim(parsed.site_logo_data_url);

        document.title = siteTitle;
        setMetaContent('application-name', siteTitle);
        setMetaContent('apple-mobile-web-app-title', siteTitle);
        setMetaContent('mobile-web-app-title', siteTitle);

        syncFavicons(siteLogoDataURL || defaultFaviconPath, siteLogoDataURL || defaultAppleIconPath);
        syncManifest(siteTitle, siteLogoDataURL);
      } catch {}
    })();
  `;

  return (
    <html suppressHydrationWarning>
      <head>
        <meta name="theme-color" content={DEFAULT_THEME_COLOR} />
        <meta name="application-name" content={DEFAULT_SITE_TITLE} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content={DEFAULT_SITE_TITLE} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-status-bar-style" content="black" />
        <meta name="mobile-web-app-title" content={DEFAULT_SITE_TITLE} />
        <link rel="manifest" href={DEFAULT_MANIFEST_PATH} />
        <link rel="icon" href={DEFAULT_FAVICON_PATH} sizes="any" />
        <link rel="shortcut icon" href={DEFAULT_FAVICON_PATH} />
        <link rel="apple-touch-icon" href={DEFAULT_APPLE_ICON_PATH} />
        <title>{DEFAULT_SITE_TITLE}</title>
        <Script
          id="branding-bootstrap"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: brandingBootstrapScript }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              #initial-loader {
                position: fixed;
                inset: 0;
                z-index: 9999;
                background: hsl(var(--background));
                transition: opacity 200ms ease;
              }
              #initial-loader.octo-hide {
                opacity: 0;
                pointer-events: none;
              }
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <div id="initial-loader" aria-hidden="true" />
        <ServiceWorkerRegister />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <QueryProvider>
            <BrandingSync />
            <LocaleProvider>
              <TooltipProvider>
                {children}
                <Toaster />
              </TooltipProvider>
            </LocaleProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
