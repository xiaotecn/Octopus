import "./globals.css";
import Script from "next/script";
import { ThemeProvider } from "@/provider/theme";
import { Toaster } from "@/components/ui/sonner"
import { LocaleProvider } from "@/provider/locale";
import QueryProvider from "@/provider/query";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { TooltipProvider } from "@/components/animate-ui/components/animate/tooltip";
import { BrandingSync } from "@/components/branding-sync";
import { BRANDING_CACHE_KEY, DEFAULT_APPLE_ICON_PATH, DEFAULT_FAVICON_PATH, DEFAULT_SITE_TITLE } from "@/lib/branding";



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

      const safeTrim = (value) => (typeof value === 'string' ? value.trim() : '');
      const setMetaContent = (name, content) => {
        const element = document.querySelector('meta[name="' + name + '"]');
        if (element) element.setAttribute('content', content);
      };
      const setLinkHref = (rel, href) => {
        const element = document.querySelector('link[rel="' + rel + '"]');
        if (element) element.setAttribute('href', href);
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

        setLinkHref('icon', siteLogoDataURL || defaultFaviconPath);
        setLinkHref('apple-touch-icon', siteLogoDataURL || defaultAppleIconPath);
      } catch {}
    })();
  `;

  return (
    <html suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#eae9e3" />
        <meta name="application-name" content={DEFAULT_SITE_TITLE} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content={DEFAULT_SITE_TITLE} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-status-bar-style" content="black" />
        <meta name="mobile-web-app-title" content={DEFAULT_SITE_TITLE} />
        <link rel="manifest" href="./manifest.json" />
        <link rel="icon" href={DEFAULT_FAVICON_PATH} sizes="any" />
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
                display: flex;
                align-items: center;
                justify-content: center;
                background: hsl(var(--background));
                color: hsl(var(--primary));
                transition: opacity 200ms ease;
              }
              #initial-loader.octo-hide {
                opacity: 0;
                pointer-events: none;
              }
              #initial-loader .octo-loader-mark {
                position: relative;
                width: 132px;
                height: 132px;
                display: grid;
                place-items: center;
              }
              #initial-loader .octo-loader-core {
                position: relative;
                z-index: 3;
                width: 18px;
                height: 18px;
                border-radius: 999px;
                background:
                  radial-gradient(circle at 35% 35%, hsl(var(--background)) 0 18%, transparent 19%),
                  radial-gradient(circle, currentColor 0 62%, color-mix(in srgb, currentColor 42%, transparent) 63% 100%);
                box-shadow:
                  0 0 0 10px color-mix(in srgb, currentColor 12%, transparent),
                  0 0 26px color-mix(in srgb, currentColor 28%, transparent);
                animation: octoPulse 1.5s cubic-bezier(0.22, 1, 0.36, 1) infinite;
              }
              #initial-loader .octo-loader-ring {
                position: absolute;
                inset: 0;
                border-radius: 999px;
                border: 1.5px solid color-mix(in srgb, currentColor 26%, transparent);
                opacity: 0;
                transform: scale(0.38);
                animation: octoRipple 2.4s cubic-bezier(0.16, 1, 0.3, 1) infinite;
              }
              #initial-loader .octo-loader-ring::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 12px;
                height: 12px;
                margin-top: -6px;
                margin-left: -6px;
                border-radius: 999px;
                background: currentColor;
                box-shadow: 0 0 18px color-mix(in srgb, currentColor 34%, transparent);
                transform-origin: 0 0;
                animation: octoOrbit 2.4s linear infinite;
              }
              #initial-loader .octo-loader-ring-a {
                animation-delay: 0s;
              }
              #initial-loader .octo-loader-ring-a::after {
                animation-delay: 0s;
              }
              #initial-loader .octo-loader-ring-b {
                animation-delay: 0.8s;
              }
              #initial-loader .octo-loader-ring-b::after {
                animation-delay: 0.8s;
              }
              #initial-loader .octo-loader-ring-c {
                animation-delay: 1.6s;
              }
              #initial-loader .octo-loader-ring-c::after {
                animation-delay: 1.6s;
              }
              #initial-loader .octo-loader-glow {
                position: absolute;
                inset: 24px;
                border-radius: 999px;
                background: radial-gradient(circle, color-mix(in srgb, currentColor 18%, transparent) 0, transparent 72%);
                filter: blur(10px);
                opacity: 0.75;
                animation: octoGlow 2.4s ease-in-out infinite;
              }

              @keyframes octoPulse {
                0%, 100% {
                  transform: scale(0.92);
                }
                50% {
                  transform: scale(1.14);
                }
              }
              @keyframes octoRipple {
                0% {
                  opacity: 0;
                  transform: scale(0.38);
                }
                18% {
                  opacity: 0.9;
                }
                100% {
                  opacity: 0;
                  transform: scale(1);
                }
              }
              @keyframes octoOrbit {
                0% {
                  transform: rotate(0deg) translateX(58px);
                }
                100% {
                  transform: rotate(360deg) translateX(58px);
                }
              }
              @keyframes octoGlow {
                0%, 100% {
                  transform: scale(0.92);
                  opacity: 0.45;
                }
                50% {
                  transform: scale(1.08);
                  opacity: 0.82;
                }
              }

              @media (prefers-reduced-motion: reduce) {
                #initial-loader .octo-loader-core,
                #initial-loader .octo-loader-ring,
                #initial-loader .octo-loader-ring::after,
                #initial-loader .octo-loader-glow {
                  animation: none !important;
                  opacity: 1 !important;
                  transform: none !important;
                }
              }
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <div id="initial-loader" role="status" aria-label="Loading">
          <div className="octo-loader-mark" aria-hidden="true">
            <span className="octo-loader-glow" />
            <span className="octo-loader-ring octo-loader-ring-a" />
            <span className="octo-loader-ring octo-loader-ring-b" />
            <span className="octo-loader-ring octo-loader-ring-c" />
            <span className="octo-loader-core" />
          </div>
        </div>
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
