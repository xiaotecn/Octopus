'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { ArrowRight, KeyRound, ShieldCheck, User, type LucideIcon } from 'lucide-react';
import { useLogin } from '@/api/endpoints/user';
import { useAPIKeyLogin } from '@/api/endpoints/apikey';
import { useBranding } from '@/api/endpoints/setting';
import BrandLogo from '@/components/modules/logo/brand-logo';
import {
    Tabs,
    TabsContent,
    TabsContents,
    TabsHighlight,
    TabsHighlightItem,
    TabsList,
    TabsTrigger,
} from '@/components/animate-ui/primitives/animate/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { buildBranding } from '@/lib/branding';
import { cn } from '@/lib/utils';

type LoginMode = 'user' | 'apikey';

interface CredentialInputProps {
    id: string;
    label: string;
    placeholder: string;
    type: string;
    value: string;
    disabled: boolean;
    required: boolean;
    onChange: (value: string) => void;
    icon: LucideIcon;
}

function CredentialInput({
    id,
    label,
    placeholder,
    type,
    value,
    disabled,
    required,
    onChange,
    icon: Icon,
}: CredentialInputProps) {
    return (
        <Field className="gap-2">
            <FieldLabel htmlFor={id} className="text-sm font-medium text-foreground">
                {label}
            </FieldLabel>
            <div className="relative">
                <Icon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    id={id}
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    required={required}
                    disabled={disabled}
                    className="h-12 rounded-2xl border-border/70 bg-background/80 pl-11 shadow-none"
                />
            </div>
        </Field>
    );
}

function HeroCard({
    active,
    icon: Icon,
    title,
    chips,
}: {
    active: boolean;
    icon: LucideIcon;
    title: string;
    chips: string[];
}) {
    return (
        <div
            className={cn(
                'rounded-3xl border p-5 transition-colors',
                active
                    ? 'border-primary/30 bg-primary/10 shadow-sm'
                    : 'border-border/60 bg-background/70'
            )}
        >
            <div className="mb-4 flex items-center gap-3">
                <div
                    className={cn(
                        'flex size-11 items-center justify-center rounded-2xl',
                        active ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                    )}
                >
                    <Icon className="size-5" />
                </div>
                <div className="text-base font-semibold text-foreground">{title}</div>
            </div>
            <div className="flex flex-wrap gap-2">
                {chips.map((chip) => (
                    <Badge
                        key={chip}
                        variant="outline"
                        className="rounded-full border-border/70 bg-background/70 px-3 py-1 text-xs text-muted-foreground"
                    >
                        {chip}
                    </Badge>
                ))}
            </div>
        </div>
    );
}

export function LoginForm({ onLoginSuccess }: { onLoginSuccess?: () => void }) {
    const t = useTranslations('login');
    const { data: brandingData } = useBranding();
    const branding = buildBranding(brandingData);
    const [mode, setMode] = useState<LoginMode>('user');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [error, setError] = useState<string | null>(null);

    const loginMutation = useLogin();
    const apiKeyLoginMutation = useAPIKeyLogin();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            if (mode === 'user') {
                await loginMutation.mutateAsync({
                    username,
                    password,
                    expire: 86400,
                });
            } else {
                await apiKeyLoginMutation.mutateAsync(apiKey);
            }

            onLoginSuccess?.();
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : t('error.generic');
            setError(errorMessage);
        }
    };

    const isPending = loginMutation.isPending || apiKeyLoginMutation.isPending;

    const handleModeChange = (value: string) => {
        setMode(value as LoginMode);
        setError(null);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative min-h-screen overflow-hidden bg-background text-foreground"
        >
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.16),transparent_28%)]" />
                <div className="absolute left-[8%] top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute bottom-12 right-[10%] h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
            </div>

            <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid w-full items-stretch gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    <motion.section
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05, duration: 0.35 }}
                    >
                        <Card className="h-full rounded-[2rem] border-border/60 bg-card/80 py-0 shadow-2xl backdrop-blur">
                            <CardContent className="flex h-full flex-col justify-between gap-8 p-6 sm:p-8">
                                <div className="space-y-5">
                                    <Badge
                                        variant="outline"
                                        className="rounded-full border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                                    >
                                        {branding.siteTitle}
                                    </Badge>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex size-[4.5rem] items-center justify-center rounded-[1.75rem] bg-background/80 ring-1 ring-border/60">
                                                <BrandLogo size={52} />
                                            </div>
                                            <div className="space-y-2">
                                                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                                    {branding.siteTitle}
                                                </h1>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <ShieldCheck className="size-4 text-primary" />
                                                    <span>{mode === 'user' ? t('mode.user') : t('mode.apikey')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="max-w-xl text-sm leading-7 text-muted-foreground sm:text-[15px]">
                                            {mode === 'user'
                                                ? `${t('usernamePlaceholder')} · ${t('passwordPlaceholder')}`
                                                : t('apikeyPlaceholder')}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <HeroCard
                                        active={mode === 'user'}
                                        icon={User}
                                        title={t('mode.user')}
                                        chips={[t('username'), t('password')]}
                                    />
                                    <HeroCard
                                        active={mode === 'apikey'}
                                        icon={KeyRound}
                                        title={t('mode.apikey')}
                                        chips={[t('apikey')]}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1, duration: 0.35 }}
                    >
                        <Card className="rounded-[2rem] border-border/60 bg-card/90 py-0 shadow-2xl backdrop-blur">
                            <CardContent className="p-6 sm:p-8">
                                <div className="mb-6 flex items-start justify-between gap-4">
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-muted-foreground">
                                            {branding.siteTitle}
                                        </div>
                                        <h2 className="text-2xl font-semibold tracking-tight">
                                            {mode === 'user' ? t('mode.user') : t('mode.apikey')}
                                        </h2>
                                    </div>
                                    <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                        {mode === 'user' ? <User className="size-5" /> : <KeyRound className="size-5" />}
                                    </div>
                                </div>

                                <Tabs value={mode} onValueChange={handleModeChange}>
                                    <TabsList className="flex rounded-2xl border border-border/60 bg-muted/40 p-1">
                                        <TabsHighlight className="rounded-xl bg-background shadow-sm">
                                            <TabsHighlightItem value="user" className="flex-1">
                                                <TabsTrigger
                                                    value="user"
                                                    className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground"
                                                >
                                                    <User className="size-4" />
                                                    {t('mode.user')}
                                                </TabsTrigger>
                                            </TabsHighlightItem>
                                            <TabsHighlightItem value="apikey" className="flex-1">
                                                <TabsTrigger
                                                    value="apikey"
                                                    className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground"
                                                >
                                                    <KeyRound className="size-4" />
                                                    {t('mode.apikey')}
                                                </TabsTrigger>
                                            </TabsHighlightItem>
                                        </TabsHighlight>
                                    </TabsList>

                                    <form onSubmit={handleSubmit} className="pt-6">
                                        <TabsContents className="space-y-5">
                                            <TabsContent value="user" className="space-y-5">
                                                <CredentialInput
                                                    id="username"
                                                    type="text"
                                                    label={t('username')}
                                                    placeholder={t('usernamePlaceholder')}
                                                    value={username}
                                                    onChange={setUsername}
                                                    required={mode === 'user'}
                                                    disabled={isPending}
                                                    icon={User}
                                                />
                                                <CredentialInput
                                                    id="password"
                                                    type="password"
                                                    label={t('password')}
                                                    placeholder={t('passwordPlaceholder')}
                                                    value={password}
                                                    onChange={setPassword}
                                                    required={mode === 'user'}
                                                    disabled={isPending}
                                                    icon={ShieldCheck}
                                                />
                                            </TabsContent>

                                            <TabsContent value="apikey" className="space-y-5">
                                                <CredentialInput
                                                    id="apikey"
                                                    type="password"
                                                    label={t('apikey')}
                                                    placeholder={t('apikeyPlaceholder')}
                                                    value={apiKey}
                                                    onChange={setApiKey}
                                                    required={mode === 'apikey'}
                                                    disabled={isPending}
                                                    icon={KeyRound}
                                                />
                                            </TabsContent>
                                        </TabsContents>

                                        <div className="mt-6 space-y-4">
                                            {error && (
                                                <FieldDescription className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-destructive">
                                                    {error}
                                                </FieldDescription>
                                            )}

                                            <Button
                                                type="submit"
                                                disabled={isPending}
                                                className="h-12 w-full rounded-2xl text-sm font-semibold"
                                            >
                                                {isPending ? t('button.loading') : t('button.submit')}
                                                {!isPending && <ArrowRight className="size-4" />}
                                            </Button>
                                        </div>
                                    </form>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </motion.section>
                </div>
            </div>
        </motion.div>
    );
}
