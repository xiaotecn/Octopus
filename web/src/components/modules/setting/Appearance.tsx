'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { Sun, Moon, Monitor, Languages, Type, ImageUp, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FieldDescription } from '@/components/ui/field';
import { useSettingStore, type Locale } from '@/stores/setting';
import { SettingKey, useSetSetting, useSettingList } from '@/api/endpoints/setting';
import { toast } from '@/components/common/Toast';
import Logo from '@/components/modules/logo';

const MAX_LOGO_FILE_SIZE = 512 * 1024;

function readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('failed to read file'));
        reader.readAsDataURL(file);
    });
}

export function SettingAppearance() {
    const t = useTranslations('setting');
    const { theme, setTheme } = useTheme();
    const { locale, setLocale } = useSettingStore();
    const { data: settings } = useSettingList();
    const setSetting = useSetSetting();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const initialSiteTitle = useRef('');
    const initialSiteLogoDataURL = useRef('');

    const [siteTitle, setSiteTitle] = useState('');
    const [siteLogoDataURL, setSiteLogoDataURL] = useState('');
    const [logoError, setLogoError] = useState('');

    useEffect(() => {
        if (!settings) return;

        const siteTitleSetting = settings.find((item) => item.key === SettingKey.SiteTitle);
        const siteLogoSetting = settings.find((item) => item.key === SettingKey.SiteLogoDataURL);

        if (siteTitleSetting) {
            queueMicrotask(() => setSiteTitle(siteTitleSetting.value));
            initialSiteTitle.current = siteTitleSetting.value;
        }

        if (siteLogoSetting) {
            queueMicrotask(() => setSiteLogoDataURL(siteLogoSetting.value));
            initialSiteLogoDataURL.current = siteLogoSetting.value;
        }
    }, [settings]);

    const handleSaveTitle = () => {
        if (siteTitle === initialSiteTitle.current) return;

        setSetting.mutate(
            { key: SettingKey.SiteTitle, value: siteTitle },
            {
                onSuccess: () => {
                    initialSiteTitle.current = siteTitle;
                    toast.success(t('saved'));
                },
            }
        );
    };

    const handleUploadLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setLogoError(t('branding.logo.invalidType'));
            return;
        }

        if (file.size > MAX_LOGO_FILE_SIZE) {
            setLogoError(t('branding.logo.tooLarge'));
            return;
        }

        try {
            const dataURL = await readFileAsDataURL(file);
            setLogoError('');
            setSetting.mutate(
                { key: SettingKey.SiteLogoDataURL, value: dataURL },
                {
                    onSuccess: () => {
                        setSiteLogoDataURL(dataURL);
                        initialSiteLogoDataURL.current = dataURL;
                        toast.success(t('saved'));
                    },
                }
            );
        } catch {
            setLogoError(t('branding.logo.readFailed'));
        }
    };

    const handleClearLogo = () => {
        setLogoError('');
        setSetting.mutate(
            { key: SettingKey.SiteLogoDataURL, value: '' },
            {
                onSuccess: () => {
                    setSiteLogoDataURL('');
                    initialSiteLogoDataURL.current = '';
                    toast.success(t('saved'));
                },
            }
        );
    };

    return (
        <div className="rounded-3xl border border-border bg-card p-6 space-y-5">
            <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
                <Sun className="h-5 w-5" />
                {t('appearance')}
            </h2>

            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    {theme === 'dark' ? <Moon className="h-5 w-5 text-muted-foreground" /> : <Sun className="h-5 w-5 text-muted-foreground" />}
                    <span className="text-sm font-medium">{t('theme.label')}</span>
                </div>
                <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger className="w-36 rounded-xl">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value="light" className="rounded-xl">
                            <Sun className="size-4" />
                            {t('theme.light')}
                        </SelectItem>
                        <SelectItem value="dark" className="rounded-xl">
                            <Moon className="size-4" />
                            {t('theme.dark')}
                        </SelectItem>
                        <SelectItem value="system" className="rounded-xl">
                            <Monitor className="size-4" />
                            {t('theme.system')}
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Languages className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">{t('language.label')}</span>
                </div>
                <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
                    <SelectTrigger className="w-36 rounded-xl">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value="zh_hans" className="rounded-xl">{t('language.zh_hans')}</SelectItem>
                        <SelectItem value="zh_hant" className="rounded-xl">{t('language.zh_hant')}</SelectItem>
                        <SelectItem value="en" className="rounded-xl">{t('language.en')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Type className="h-5 w-5 text-muted-foreground" />
                    <div>
                        <div className="text-sm font-medium">{t('branding.title.label')}</div>
                        <FieldDescription>{t('branding.title.hint')}</FieldDescription>
                    </div>
                </div>
                <Input
                    value={siteTitle}
                    onChange={(event) => setSiteTitle(event.target.value)}
                    onBlur={handleSaveTitle}
                    placeholder={t('branding.title.placeholder')}
                    className="w-56 rounded-xl"
                    maxLength={64}
                />
            </div>

            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 pt-2">
                    <ImageUp className="h-5 w-5 text-muted-foreground" />
                    <div>
                        <div className="text-sm font-medium">{t('branding.logo.label')}</div>
                        <FieldDescription>{t('branding.logo.hint')}</FieldDescription>
                    </div>
                </div>
                <div className="w-72 space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted/40">
                            {siteLogoDataURL ? (
                                <img
                                    src={siteLogoDataURL}
                                    alt={siteTitle || t('branding.logo.label')}
                                    className="h-10 w-10 object-contain"
                                />
                            ) : (
                                <Logo size={40} />
                            )}
                        </div>
                        <div className="flex gap-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleUploadLogo}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-xl"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={setSetting.isPending}
                            >
                                {t('branding.logo.upload')}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                className="rounded-xl"
                                onClick={handleClearLogo}
                                disabled={!siteLogoDataURL || setSetting.isPending}
                            >
                                <Trash2 className="mr-1 size-4" />
                                {t('branding.logo.clear')}
                            </Button>
                        </div>
                    </div>
                    {logoError ? (
                        <FieldDescription className="text-destructive">{logoError}</FieldDescription>
                    ) : (
                        <FieldDescription>{t('branding.logo.previewHint')}</FieldDescription>
                    )}
                </div>
            </div>
        </div>
    );
}
