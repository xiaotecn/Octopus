'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from '@/api/endpoints/user';
import { LoginForm } from '@/components/modules/login';
import { APIKeyDashboard } from '@/components/modules/apikey-dashboard';
import { ContentLoader } from '@/route/content-loader';
import { NavBar, useNavStore } from '@/components/modules/navbar';
import { useTranslations } from 'next-intl';
import BrandLogo from '@/components/modules/logo/brand-logo';
import { Toolbar } from '@/components/modules/toolbar';
import { ChannelTabSwitcher, ChannelHeaderActions } from '@/components/modules/channel/TabSwitcher';
import { ENTRANCE_VARIANTS } from '@/lib/animations/fluid-transitions';
import { useQueryClient } from '@tanstack/react-query';
import { CONTENT_MAP } from '@/route';
import { apiClient } from '@/api/client';
import { logger } from '@/lib/logger';
import { useBranding } from '@/api/endpoints/setting';
import { buildBranding } from '@/lib/branding';

export function AppContainer() {
    const { isAuthenticated, isAPIKeyAuth, isLoading: authLoading } = useAuth();
    const { data: brandingData } = useBranding();
    const branding = buildBranding(brandingData);
    const { activeItem, direction } = useNavStore();
    const t = useTranslations('navbar');
    const queryClient = useQueryClient();
    const bootstrapStartedRef = useRef(false);

    useEffect(() => {
        const el = document.getElementById('initial-loader');
        if (!el) return;

        el.classList.add('octo-hide');
        const timer = setTimeout(() => el.remove(), 220);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated) return;

        if (bootstrapStartedRef.current) return;
        bootstrapStartedRef.current = true;

        const prefetches: Array<Promise<unknown>> = [];

        if (isAPIKeyAuth) {
            prefetches.push(
                queryClient.prefetchQuery({
                    queryKey: ['apikey', 'dashboard', 'stats'],
                    queryFn: async () => apiClient.get('/api/v1/apikey/stats'),
                })
            );
        } else {
            const component = CONTENT_MAP[activeItem];
            if (component?.preload) {
                prefetches.push(component.preload());
            }

            switch (activeItem) {
                case 'home': {
                    prefetches.push(
                        queryClient.prefetchQuery({
                            queryKey: ['stats', 'total'],
                            queryFn: async () => apiClient.get('/api/v1/stats/total'),
                        })
                    );
                    prefetches.push(
                        queryClient.prefetchQuery({
                            queryKey: ['stats', 'daily'],
                            queryFn: async () => apiClient.get('/api/v1/stats/daily'),
                        })
                    );
                    prefetches.push(
                        queryClient.prefetchQuery({
                            queryKey: ['stats', 'hourly'],
                            queryFn: async () => apiClient.get('/api/v1/stats/hourly'),
                        })
                    );
                    prefetches.push(
                        queryClient.prefetchQuery({
                            queryKey: ['channels', 'list'],
                            queryFn: async () => apiClient.get('/api/v1/channel/list'),
                        })
                    );
                    break;
                }
                case 'site': {
                    prefetches.push(
                        queryClient.prefetchQuery({
                            queryKey: ['sites', 'list'],
                            queryFn: async () => apiClient.get('/api/v1/site/list'),
                        })
                    );
                    break;
                }
                case 'channel': {
                    prefetches.push(
                        queryClient.prefetchQuery({
                            queryKey: ['channels', 'list'],
                            queryFn: async () => apiClient.get('/api/v1/channel/list'),
                        })
                    );
                    break;
                }
                case 'group': {
                    prefetches.push(
                        queryClient.prefetchQuery({
                            queryKey: ['groups', 'list'],
                            queryFn: async () => apiClient.get('/api/v1/group/list'),
                        })
                    );
                    prefetches.push(
                        queryClient.prefetchQuery({
                            queryKey: ['models', 'channel'],
                            queryFn: async () => apiClient.get('/api/v1/model/channel'),
                        })
                    );
                    break;
                }
                case 'key': {
                    prefetches.push(
                        queryClient.prefetchQuery({
                            queryKey: ['apikeys', 'list'],
                            queryFn: async () => apiClient.get('/api/v1/apikey/list'),
                        })
                    );
                    break;
                }
                case 'model': {
                    prefetches.push(
                        queryClient.prefetchQuery({
                            queryKey: ['models', 'list'],
                            queryFn: async () => apiClient.get('/api/v1/model/list'),
                        })
                    );
                    break;
                }
                default:
                    break;
            }
        }

        Promise.allSettled(prefetches).catch((e) => {
            logger.warn('bootstrap prefetch failed:', e);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoading, isAuthenticated]);

    if (authLoading) {
        return <div className="min-h-screen bg-background" />;
    }

    if (isAPIKeyAuth) {
        return (
            <AnimatePresence mode="wait">
                <APIKeyDashboard key="apikey-dashboard" />
            </AnimatePresence>
        );
    }

    if (!isAuthenticated) {
        return (
            <AnimatePresence mode="wait">
                <LoginForm key="login" />
            </AnimatePresence>
        );
    }

    return (
        <motion.div
            key="main-app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mx-auto flex h-dvh max-w-6xl flex-col overflow-hidden px-3 md:grid md:grid-cols-[auto_1fr] md:gap-6 md:px-6"
        >
            <NavBar />
            <main className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
                <header className="my-6 flex flex-none items-center gap-x-2">
                    <div className="flex min-w-0 flex-1 items-center gap-x-2 md:-ml-6">
                        <BrandLogo size={48} />
                        <div className="flex-1 overflow-hidden">
                            <div className="truncate text-sm font-semibold text-muted-foreground">
                                {branding.siteTitle}
                            </div>
                            <AnimatePresence mode="wait" custom={direction}>
                                <motion.div
                                    key={activeItem}
                                    custom={direction}
                                    variants={{
                                        initial: (dir: number) => ({
                                            y: 32 * dir,
                                            opacity: 0,
                                        }),
                                        animate: {
                                            y: 0,
                                            opacity: 1,
                                        },
                                        exit: (dir: number) => ({
                                            y: -32 * dir,
                                            opacity: 0,
                                        }),
                                    }}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    transition={{ duration: 0.3 }}
                                    className="flex items-baseline gap-6"
                                >
                                    <span className="mt-1 text-3xl font-bold">{t(activeItem)}</span>
                                    {activeItem === 'channel' && <ChannelTabSwitcher />}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                    <div className="ml-auto flex items-center gap-3">
                        {activeItem === 'channel' && <ChannelHeaderActions />}
                        <Toolbar />
                    </div>
                </header>
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={activeItem}
                        variants={ENTRANCE_VARIANTS.content}
                        initial="initial"
                        animate="animate"
                        exit={{
                            opacity: 0,
                            scale: 0.98,
                        }}
                        transition={{ duration: 0.25 }}
                        className="h-full min-h-0 flex-1"
                    >
                        <ContentLoader activeRoute={activeItem} />
                    </motion.div>
                </AnimatePresence>
            </main>
        </motion.div>
    );
}
