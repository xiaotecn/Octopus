'use client';

import { useCallback, useId, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { KeyRound, Plus, Loader, Trash2, Check, X, Info, CalendarDays, Pencil, Maximize2, Eye, EyeOff, Sparkles, WalletCards, Gauge, ShieldCheck, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PageWrapper } from '@/components/common/PageWrapper';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
    MorphingDialog,
    MorphingDialogContainer,
    MorphingDialogContent,
    MorphingDialogTrigger,
    useMorphingDialog,
} from '@/components/ui/morphing-dialog';
import {
    useAPIKeyList,
    useCreateAPIKey,
    useUpdateAPIKey,
    useDeleteAPIKey,
    type APIKey,
} from '@/api/endpoints/apikey';
import { useGroupList } from '@/api/endpoints/group';
import { useStatsAPIKey } from '@/api/endpoints/stats';
import { cn } from '@/lib/utils';
import { toast } from '@/components/common/Toast';
import { CopyIconButton } from '@/components/common/CopyButton';
import type { ApiError } from '@/api/types';
import type { StatsAPIKeyFormatted } from '@/api/endpoints/stats';

function toExpireAt(date: Date, time: string): number {
    const t = /^\d{2}:\d{2}$/.test(time) ? time : '00:00';
    const [hh, mm] = t.split(':').map(Number);
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), hh, mm, 0));
    // 返回 Unix 时间戳（秒）
    return Math.floor(d.getTime() / 1000);
}

function parseExpireDate(expireAt?: number): Date | undefined {
    if (!expireAt) return undefined;
    // 从 Unix 时间戳（秒）转换为 Date
    const d = new Date(expireAt * 1000);
    return isNaN(d.getTime()) ? undefined : d;
}

function normalizeHHmm(input: string): string {
    const cleaned = input.replace(/[^\d:]/g, '');
    const parts = cleaned.includes(':') ? cleaned.split(':') : [cleaned.slice(0, 2), cleaned.slice(2, 4)];
    const hh = Math.min(23, Math.max(0, parseInt(parts[0] || '0', 10)));
    const mm = Math.min(59, Math.max(0, parseInt(parts[1] || '0', 10)));
    return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
}

function normalizeMoneyInput(input: string): string {
    const cleaned = input.replace(/[^\d.]/g, '');
    const [intPart, ...rest] = cleaned.split('.');
    return rest.length > 0 ? `${intPart}.${rest.join('').slice(0, 6)}` : intPart;
}

function toggleModel(current: string | undefined, model: string): string | undefined {
    const models = current ? current.split(',').filter(Boolean) : [];
    const next = models.includes(model)
        ? models.filter((m) => m !== model)
        : [...models, model];
    return next.length ? next.join(',') : undefined;
}

function hasModel(supported: string | undefined, model: string): boolean {
    return supported ? supported.split(',').includes(model) : false;
}

function maskAPIKey(value: string): string {
    if (!value) return '';
    if (value.length <= 12) return `${value.slice(0, 4)}****${value.slice(-2)}`;
    return `${value.slice(0, 6)}******${value.slice(-6)}`;
}

function formatDateTime(value?: number): string {
    if (!value) return '';
    const date = new Date(value * 1000);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

interface APIKeyFormProps {
    apiKey?: APIKey;
    isPending: boolean;
    submitLabel: string;
    onSubmit: (data: Omit<APIKey, 'id' | 'api_key'>) => void;
    onClose: () => void;
}

function APIKeyForm({ apiKey, isPending, submitLabel, onSubmit, onClose }: APIKeyFormProps) {
    const t = useTranslations('setting');
    const { data: groups = [] } = useGroupList();

    const [form, setForm] = useState<Omit<APIKey, 'id' | 'api_key'>>(() => ({
        name: apiKey?.name ?? '',
        enabled: apiKey?.enabled ?? true,
        expire_at: apiKey?.expire_at,
        max_cost: apiKey?.max_cost != null ? apiKey.max_cost : -1,
        supported_models: apiKey?.supported_models,
    }));
    const [maxCostInput, setMaxCostInput] = useState(() =>
        apiKey?.max_cost != null && apiKey.max_cost >= 0 ? String(apiKey.max_cost) : ''
    );
    const [expireTime, setExpireTime] = useState(() => {
        if (apiKey?.expire_at) {
            const d = new Date(apiKey.expire_at * 1000);
            if (!isNaN(d.getTime())) {
                return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
            }
        }
        return '00:00';
    });
    const [expireOpen, setExpireOpen] = useState(false);

    const availableModels = useMemo(() => {
        const names = groups.map((g) => g.name).filter(Boolean);
        return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
    }, [groups]);

    const expireDate = parseExpireDate(form.expire_at);
    const neverExpire = !form.expire_at;
    const isUnlimitedCost = (form.max_cost ?? -1) < 0;

    const expireLabel = neverExpire
        ? t('apiKey.form.neverExpire')
        : expireDate
            ? expireDate.toLocaleDateString()
            : t('apiKey.form.selectDate');

    const updateForm = useCallback((updater: Partial<Omit<APIKey, 'id' | 'api_key'>>) => {
        setForm((prev) => ({ ...prev, ...updater }));
    }, []);

    const handleSelectDate = useCallback((d: Date | undefined) => {
        if (d) {
            updateForm({ expire_at: toExpireAt(d, expireTime) });
            setExpireOpen(false);
        } else {
            updateForm({ expire_at: undefined });
        }
    }, [updateForm, expireTime]);

    const handleTimeBlur = useCallback(() => {
        if (!expireDate) return;
        const normalized = normalizeHHmm(expireTime);
        setExpireTime(normalized);
        updateForm({ expire_at: toExpireAt(expireDate, normalized) });
    }, [expireDate, expireTime, updateForm]);

    const handleToggleNeverExpire = useCallback(() => {
        if (neverExpire) {
            updateForm({ expire_at: toExpireAt(new Date(), expireTime) });
        } else {
            updateForm({ expire_at: undefined });
            setExpireOpen(false);
        }
    }, [neverExpire, expireTime, updateForm]);

    const handleMaxCostChange = useCallback((val: string) => {
        const normalized = normalizeMoneyInput(val);
        setMaxCostInput(normalized);
        if (normalized.trim() === '') {
            updateForm({ max_cost: -1 });
            return;
        }
        const num = parseFloat(normalized);
        updateForm({ max_cost: Number.isFinite(num) ? num : -1 });
    }, [updateForm]);

    const handleClearMaxCost = useCallback(() => {
        setMaxCostInput('');
        updateForm({ max_cost: -1 });
    }, [updateForm]);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        onSubmit(form);
    }, [form, onSubmit]);

    return (
        <form onSubmit={handleSubmit} className="grid gap-2">
            <label className="grid gap-1 text-xs text-muted-foreground">
                {t('apiKey.form.name')}
                <Input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateForm({ name: e.target.value })}
                    className="h-9 text-sm rounded-xl"
                    disabled={isPending}
                    required
                />
            </label>

            <div className="grid gap-1 text-xs text-muted-foreground">
                当前余额
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                        <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="请输入余额"
                            value={maxCostInput}
                            onChange={(e) => handleMaxCostChange(e.target.value)}
                            className="h-9 text-sm rounded-xl pl-7"
                            disabled={isPending}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleClearMaxCost}
                        disabled={isPending}
                        aria-pressed={isUnlimitedCost}
                        className={cn(
                            'h-9 px-3 rounded-xl border text-sm transition-colors shrink-0',
                            isUnlimitedCost
                                ? 'bg-primary text-primary-foreground border-primary/30'
                                : 'border-border bg-muted/20 text-foreground hover:bg-muted/30',
                            isPending && 'opacity-50 cursor-not-allowed'
                        )}
                    >
                        不限额
                    </button>
                </div>
            </div>

            <div className="grid gap-1 text-xs text-muted-foreground">
                {t('apiKey.form.expireAt')}
                <div className="flex items-center gap-2 relative">
                    <Popover
                        open={expireOpen && !neverExpire}
                        onOpenChange={setExpireOpen}
                    >
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                disabled={isPending || neverExpire}
                                className="h-9 flex-1 flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/20 px-3 text-sm text-foreground transition-colors hover:bg-muted/30 disabled:opacity-50"
                            >
                                <span className="truncate">{expireLabel}</span>
                                <CalendarDays className="size-4 text-muted-foreground" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent
                            align="start"
                            side="bottom"
                            sideOffset={8}
                            className="w-fit rounded-2xl border border-border/60 shadow-xl overflow-hidden bg-card p-0"
                        >
                            <Calendar
                                mode="single"
                                selected={expireDate}
                                onSelect={handleSelectDate}
                                disabled={isPending}
                                classNames={{ today: '' }}
                            />
                        </PopoverContent>
                    </Popover>

                    <Input
                        type="text"
                        value={expireTime}
                        onChange={(e) => setExpireTime(e.target.value.replace(/[^\d:]/g, '').slice(0, 5))}
                        onBlur={handleTimeBlur}
                        className="h-9 w-[92px] text-sm rounded-xl"
                        disabled={isPending || neverExpire || !expireDate}
                        inputMode="numeric"
                        placeholder="HH:mm"
                    />

                    <button
                        type="button"
                        onClick={handleToggleNeverExpire}
                        disabled={isPending}
                        aria-pressed={neverExpire}
                        className={cn(
                            'h-9 px-3 rounded-xl border text-sm transition-colors whitespace-nowrap shrink-0',
                            neverExpire
                                ? 'bg-primary text-primary-foreground border-primary/30'
                                : 'border-border bg-muted/20 text-foreground hover:bg-muted/30',
                            isPending && 'opacity-50 cursor-not-allowed'
                        )}
                    >
                        {t('apiKey.form.neverExpire')}
                    </button>
                </div>
            </div>

            <div className="grid gap-1">
                <div className="text-xs text-muted-foreground">{t('apiKey.form.supportedModels')}</div>
                <div className="max-h-40 overflow-auto rounded-xl p-2">
                    {availableModels.length === 0 ? (
                        <div className="text-xs text-muted-foreground py-2 text-center">
                            {t('apiKey.form.noModels')}
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {availableModels.map((m) => {
                                const checked = hasModel(form.supported_models, m);
                                return (
                                    <button
                                        key={m}
                                        type="button"
                                        disabled={isPending}
                                        onClick={() => updateForm({ supported_models: toggleModel(form.supported_models, m) })}
                                        className="text-left disabled:opacity-50"
                                    >
                                        <Badge
                                            variant={checked ? 'default' : 'outline'}
                                            className={cn(
                                                'cursor-pointer select-none',
                                                !checked && 'bg-background/40 hover:bg-background/70'
                                            )}
                                        >
                                            {m}
                                        </Badge>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
                <div className="text-[11px] text-muted-foreground/80">{t('apiKey.form.modelsHint')}</div>
            </div>

            <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-muted-foreground">{t('apiKey.form.enabled')}</span>
                <Switch
                    checked={form.enabled ?? true}
                    onCheckedChange={(checked) => updateForm({ enabled: checked })}
                    disabled={isPending}
                />
            </div>

            <div className="flex gap-2 pt-2 mt-3">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isPending}
                    className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-xl bg-muted text-muted-foreground text-sm font-medium transition-all hover:bg-muted/80 active:scale-[0.98] disabled:opacity-50"
                >
                    <X className="size-4" />
                    {t('apiKey.form.cancel')}
                </button>
                <button
                    type="submit"
                    disabled={isPending || !form.name.trim()}
                    className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
                >
                    {isPending ? <Loader className="size-4 animate-spin" /> : <Check className="size-4" />}
                    {submitLabel}
                </button>
            </div>
        </form>
    );
}

function APIKeyFormOverlay({
    layoutId,
    apiKey,
    isPending,
    submitLabel,
    onSubmit,
    onClose,
}: {
    layoutId: string;
    apiKey?: APIKey;
    isPending: boolean;
    submitLabel: string;
    onSubmit: (data: Omit<APIKey, 'id' | 'api_key'>) => void;
    onClose: () => void;
}) {
    return (
        <motion.div
            layoutId={layoutId}
            className="absolute left-1/2 top-1/2 z-20 w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 bg-card p-5 rounded-3xl border border-border max-h-[80vh] overflow-auto"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
            <APIKeyForm
                apiKey={apiKey}
                isPending={isPending}
                submitLabel={submitLabel}
                onSubmit={onSubmit}
                onClose={onClose}
            />
        </motion.div>
    );
}

function APIKeyStatsCard({
    layoutId,
    apiKey,
    onClose,
}: {
    layoutId: string;
    apiKey: APIKey;
    onClose: () => void;
}) {
    const t = useTranslations('setting');
    const { data: statsList = [] } = useStatsAPIKey();
    const stats = useMemo(() => statsList.find((s) => s.api_key_id === apiKey.id), [statsList, apiKey.id]);

    return (
        <motion.div
            layoutId={layoutId}
            className="absolute left-1/2 top-1/2 z-30 w-[min(320px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex flex-col bg-card p-5 rounded-3xl border border-border max-h-[80vh] overflow-auto"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
            <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-sm font-semibold text-card-foreground line-clamp-1">
                    {apiKey.name}
                </h3>
                <button
                    type="button"
                    onClick={onClose}
                    className="size-8 flex items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-muted/80"
                >
                    <X className="size-4" />
                </button>
            </div>

            {!stats ? (
                <div className="text-sm text-muted-foreground">{t('apiKey.stats.noData')}</div>
            ) : (
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-muted/40 p-3">
                        <div className="text-xs text-muted-foreground">{t('apiKey.stats.inputToken')}</div>
                        <div className="font-medium tabular-nums">
                            {stats.input_token.formatted.value}
                            {stats.input_token.formatted.unit}
                        </div>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3">
                        <div className="text-xs text-muted-foreground">{t('apiKey.stats.outputToken')}</div>
                        <div className="font-medium tabular-nums">
                            {stats.output_token.formatted.value}
                            {stats.output_token.formatted.unit}
                        </div>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3">
                        <div className="text-xs text-muted-foreground">{t('apiKey.stats.inputCost')}</div>
                        <div className="font-medium tabular-nums">
                            {stats.input_cost.formatted.value}
                            {stats.input_cost.formatted.unit}
                        </div>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3">
                        <div className="text-xs text-muted-foreground">{t('apiKey.stats.outputCost')}</div>
                        <div className="font-medium tabular-nums">
                            {stats.output_cost.formatted.value}
                            {stats.output_cost.formatted.unit}
                        </div>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3">
                        <div className="text-xs text-muted-foreground">{t('apiKey.stats.requestSuccess')}</div>
                        <div className="font-medium tabular-nums">
                            {stats.request_success.formatted.value}
                            {stats.request_success.formatted.unit}
                        </div>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3">
                        <div className="text-xs text-muted-foreground">{t('apiKey.stats.requestFailed')}</div>
                        <div className="font-medium tabular-nums">
                            {stats.request_failed.formatted.value}
                            {stats.request_failed.formatted.unit}
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

function APIKeyKeyItem({
    apiKey,
    stats,
    statsLayoutId,
    editLayoutId,
    deleteLayoutId,
    onViewStats,
    onEdit,
    onDelete,
    isDeleting,
}: {
    apiKey: APIKey;
    stats?: StatsAPIKeyFormatted;
    statsLayoutId: string;
    editLayoutId: string;
    deleteLayoutId: string;
    onViewStats: () => void;
    onEdit: () => void;
    onDelete: () => void;
    isDeleting: boolean;
  }) {
      const t = useTranslations('setting');
      const [confirmDelete, setConfirmDelete] = useState(false);
      const [showSecret, setShowSecret] = useState(false);
      const [expanded, setExpanded] = useState(false);
      const authorizedModels = useMemo(
          () => apiKey.supported_models?.split(',').map((item) => item.trim()).filter(Boolean) ?? [],
          [apiKey.supported_models]
      );
    const tokenUsage = stats?.total_token.formatted;
    const totalCostRaw = stats?.total_cost.raw ?? 0;
    const totalCostFormatted = stats?.total_cost.formatted;
    const hasQuotaLimit = typeof apiKey.max_cost === 'number' && Number.isFinite(apiKey.max_cost) && apiKey.max_cost >= 0;
    const currentBalance = hasQuotaLimit ? Math.max(0, apiKey.max_cost!) : undefined;
    const quotaProgress = hasQuotaLimit && (currentBalance! + totalCostRaw) > 0
        ? Math.min(100, (totalCostRaw / (currentBalance! + totalCostRaw)) * 100)
        : 0;
      const expireAtLabel = apiKey.expire_at
          ? formatDateTime(apiKey.expire_at)
          : t('apiKey.card.neverExpire');
      const statusLabel = apiKey.enabled ? t('apiKey.card.enabled') : t('apiKey.card.disabled');
      const keyValue = showSecret ? apiKey.api_key : maskAPIKey(apiKey.api_key);
      const summaryModels = authorizedModels.length === 0
          ? t('apiKey.card.allModels')
          : authorizedModels.slice(0, 2).join(', ');
      const summaryUsage = tokenUsage ? `${tokenUsage.value}${tokenUsage.unit}` : t('apiKey.card.noUsage');

      return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-muted/30 p-4 origin-top shadow-sm transition-colors hover:border-primary/25"
        >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-2">
                          <div className="flex items-center gap-2">
                              <span className="truncate text-base font-semibold text-card-foreground">{apiKey.name}</span>
                            <Badge variant={apiKey.enabled ? 'default' : 'outline'} className="rounded-full px-2 py-0.5 text-[10px]">
                                {statusLabel}
                            </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>{t('apiKey.card.id', { id: apiKey.id })}</span>
                            <span>|</span>
                            <span>{t('apiKey.card.expireAt')}: {expireAtLabel}</span>
                        </div>
                    </div>

                      <div className="flex items-center gap-1.5">
                          <button
                              type="button"
                              onClick={() => setExpanded((current) => !current)}
                              className="flex size-8 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95"
                              title={expanded ? t('apiKey.card.actions.collapse') : t('apiKey.card.actions.expand')}
                          >
                              <ChevronDown className={cn('size-4 transition-transform', expanded ? 'rotate-180' : '')} />
                          </button>
                          <motion.button
                              type="button"
                              layoutId={statsLayoutId}
                            onClick={onViewStats}
                            className="flex size-8 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95"
                            title={t('apiKey.card.actions.stats')}
                        >
                            <Info className="size-4" />
                        </motion.button>
                        <motion.button
                            type="button"
                            layoutId={editLayoutId}
                            onClick={onEdit}
                            className="flex size-8 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95"
                            title={t('apiKey.card.actions.edit')}
                        >
                            <Pencil className="size-4" />
                        </motion.button>

                        {!confirmDelete && (
                            <motion.button
                                layoutId={deleteLayoutId}
                                onClick={() => setConfirmDelete(true)}
                                className="flex size-8 items-center justify-center rounded-xl bg-destructive/10 text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
                                title={t('apiKey.card.actions.delete')}
                            >
                                <Trash2 className="size-4" />
                            </motion.button>
                        )}
                    </div>
                </div>

                  <div className="grid gap-2 md:grid-cols-3">
                      <div className="rounded-xl bg-background/60 px-3 py-2">
                          <div className="text-[11px] text-muted-foreground">{t('apiKey.card.authorizedModels')}</div>
                          <div className="truncate text-sm font-medium text-card-foreground">{summaryModels}</div>
                      </div>
                      <div className="rounded-xl bg-background/60 px-3 py-2">
                          <div className="text-[11px] text-muted-foreground">当前余额</div>
                          <div className="truncate text-sm font-medium text-card-foreground">
                              {hasQuotaLimit ? `$${currentBalance?.toFixed(2)}` : t('apiKey.card.unlimitedQuota')}
                          </div>
                      </div>
                      <div className="rounded-xl bg-background/60 px-3 py-2">
                          <div className="text-[11px] text-muted-foreground">{t('apiKey.card.totalTokens')}</div>
                          <div className="truncate text-sm font-medium text-card-foreground">{summaryUsage}</div>
                      </div>
                  </div>

                  <AnimatePresence initial={false}>
                      {expanded && (
                          <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                          >
                              <div className="mt-1 flex flex-col gap-3">
                                  <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
                                      <div className="mb-2 flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                              <ShieldCheck className="size-3.5" />
                                              {t('apiKey.card.secret')}
                                          </div>
                                          <div className="flex items-center gap-1">
                                              <button
                                                  type="button"
                                                  onClick={() => setShowSecret((current) => !current)}
                                                  className="flex size-8 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                  title={showSecret ? t('apiKey.card.actions.hide') : t('apiKey.card.actions.show')}
                                              >
                                                  {showSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                              </button>
                                              <CopyIconButton
                                                  text={apiKey.api_key}
                                                  className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-95"
                                                  copyIconClassName="size-4"
                                                  checkIconClassName="size-4"
                                              />
                                          </div>
                                      </div>
                                      <div className="truncate rounded-xl bg-muted/40 px-3 py-2 font-mono text-sm text-card-foreground">
                                          {keyValue}
                                      </div>
                                  </div>

                                  <div className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                                      <div className="rounded-2xl border border-border/60 bg-background/60 p-3">
                                          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                              <Sparkles className="size-3.5" />
                                              {t('apiKey.card.authorizedModels')}
                                          </div>
                                          {authorizedModels.length === 0 ? (
                                              <div className="text-sm text-muted-foreground">{t('apiKey.card.allModels')}</div>
                                          ) : (
                                              <div className="flex flex-wrap gap-2">
                                                  {authorizedModels.slice(0, 6).map((model) => (
                                                      <Badge key={model} variant="outline" className="rounded-full bg-background/70 px-2.5 py-1 text-xs">
                                                          {model}
                                                      </Badge>
                                                  ))}
                                                  {authorizedModels.length > 6 && (
                                                      <Badge variant="outline" className="rounded-full bg-background/70 px-2.5 py-1 text-xs">
                                                          {t('apiKey.card.moreModels', { count: authorizedModels.length - 6 })}
                                                      </Badge>
                                                  )}
                                              </div>
                                          )}
                                      </div>

                                      <div className="rounded-2xl border border-border/60 bg-background/60 p-3">
                                          <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                              <Gauge className="size-3.5" />
                                              {t('apiKey.card.usage')}
                                          </div>
                                          <div className="grid gap-3">
                                              <div className="rounded-xl bg-muted/40 p-3">
                                                  <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                                                      <WalletCards className="size-3.5" />
                                                      当前余额
                                                  </div>
                                                  {hasQuotaLimit ? (
                                                      <>
                                                          <div className="text-sm font-semibold text-card-foreground">
                                                              ${currentBalance?.toFixed(2)} / 已用 ${totalCostRaw.toFixed(2)}
                                                          </div>
                                                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                                                              <div
                                                                  className={cn(
                                                                      'h-full rounded-full transition-all',
                                                                      quotaProgress >= 90 ? 'bg-destructive' : 'bg-primary'
                                                                  )}
                                                                  style={{ width: `${quotaProgress}%` }}
                                                              />
                                                          </div>
                                                      </>
                                                  ) : (
                                                      <div className="text-sm font-semibold text-card-foreground">
                                                          {t('apiKey.card.unlimitedQuota')}
                                                      </div>
                                                  )}
                                              </div>

                                              <div className="grid grid-cols-2 gap-3">
                                                  <div className="rounded-xl bg-muted/40 p-3">
                                                      <div className="text-xs text-muted-foreground">{t('apiKey.card.totalTokens')}</div>
                                                      <div className="mt-1 text-sm font-semibold text-card-foreground">
                                                          {tokenUsage ? `${tokenUsage.value}${tokenUsage.unit}` : t('apiKey.card.noUsage')}
                                                      </div>
                                                  </div>
                                                  <div className="rounded-xl bg-muted/40 p-3">
                                                      <div className="text-xs text-muted-foreground">{t('apiKey.card.totalCost')}</div>
                                                      <div className="mt-1 text-sm font-semibold text-card-foreground">
                                                          {totalCostFormatted ? `${totalCostFormatted.value}${totalCostFormatted.unit}` : '$0.00'}
                                                      </div>
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </motion.div>
                      )}
                  </AnimatePresence>
              </div>

            <AnimatePresence>
                {confirmDelete && (
                    <motion.div
                        layoutId={deleteLayoutId}
                        className="absolute inset-0 flex items-center justify-center gap-2 rounded-2xl bg-destructive p-4"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    >
                        <button
                            onClick={() => setConfirmDelete(false)}
                            className="flex size-8 items-center justify-center rounded-lg bg-destructive-foreground/20 text-destructive-foreground transition-all hover:bg-destructive-foreground/30 active:scale-95"
                        >
                            <X className="size-4" />
                        </button>
                        <button
                            onClick={onDelete}
                            disabled={isDeleting}
                            className="flex-1 h-8 flex items-center justify-center gap-1.5 rounded-lg bg-destructive-foreground text-destructive text-sm font-medium transition-all hover:bg-destructive-foreground/90 active:scale-[0.98] disabled:opacity-50"
                        >
                            <Trash2 className="size-3.5" />
                            {isDeleting ? '...' : t('apiKey.form.confirm')}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function APIKeyPanelBase({
    idPrefix,
    containerClassName,
    listClassName,
    renderHeaderExtra,
}: {
    idPrefix: string;
    containerClassName: string;
    listClassName: string;
    renderHeaderExtra?: (ctx: {
        disabled: boolean;
        onCloseAllOverlays: () => void;
    }) => React.ReactNode;
}) {
    const t = useTranslations('setting');
    const { data: apiKeys, isLoading: apiKeysLoading, error: apiKeysError } = useAPIKeyList();
    const { data: statsList = [] } = useStatsAPIKey();
    const createAPIKey = useCreateAPIKey();
    const updateAPIKey = useUpdateAPIKey();
    const deleteAPIKey = useDeleteAPIKey();

    const instanceId = useId();
    const addLayoutId = `add-btn-${idPrefix}-${instanceId}`;
    const statsPrefix = `${idPrefix}-stats-${instanceId}`;
    const editPrefix = `${idPrefix}-edit-${instanceId}`;
    const deletePrefix = `${idPrefix}-delete-`;

    const [isAdding, setIsAdding] = useState(false);
    const [viewingStats, setViewingStats] = useState<{ apiKey: APIKey; layoutId: string } | null>(null);
    const [editingKey, setEditingKey] = useState<{ apiKey: APIKey; layoutId: string } | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const sortedApiKeys = useMemo(() => {
        if (!apiKeys) return [];
        return [...apiKeys].sort((a, b) => a.id - b.id);
    }, [apiKeys]);

    const statsByAPIKeyId = useMemo(() => {
        return new Map(statsList.map((item) => [item.api_key_id, item]));
    }, [statsList]);

    const handleDelete = useCallback((id: number) => {
        setDeletingId(id);
        deleteAPIKey.mutate(id, {
            onSuccess: () => {
                toast.success(t('apiKey.toast.deleteSuccess'));
            },
            onError: (error) => {
                const msg = (error as unknown as ApiError)?.message;
                toast.error(t('apiKey.toast.deleteError'), { description: msg });
            },
            onSettled: () => setDeletingId((cur) => (cur === id ? null : cur)),
        });
    }, [deleteAPIKey, t]);

    const closeAllOverlays = useCallback(() => {
        setIsAdding(false);
        setViewingStats(null);
        setEditingKey(null);
    }, []);

    const disabledHeaderActions = createAPIKey.isPending || isAdding || !!viewingStats || !!editingKey;

    const handleCreate = useCallback((data: Omit<APIKey, 'id' | 'api_key'>) => {
        createAPIKey.mutate(data, {
            onSuccess: () => {
                toast.success(t('apiKey.toast.createSuccess'));
                setIsAdding(false);
            },
            onError: (error) => {
                const msg = (error as unknown as ApiError)?.message;
                toast.error(t('apiKey.toast.createError'), { description: msg });
            },
        });
    }, [createAPIKey, t]);

    const handleUpdate = useCallback((apiKey: APIKey, data: Omit<APIKey, 'id' | 'api_key'>) => {
        updateAPIKey.mutate({ id: apiKey.id, ...data }, {
            onSuccess: () => {
                toast.success(t('apiKey.toast.updateSuccess'));
                setEditingKey(null);
            },
            onError: (error) => {
                const msg = (error as unknown as ApiError)?.message;
                toast.error(t('apiKey.toast.updateError'), { description: msg });
            },
        });
    }, [t, updateAPIKey]);

    return (
        <div className={containerClassName}>
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
                    <KeyRound className="h-5 w-5" />
                    {t('apiKey.title')}
                </h2>
                <div className="flex items-center gap-2">
                    <motion.button
                        layoutId={addLayoutId}
                        type="button"
                        onClick={() => setIsAdding(true)}
                        disabled={disabledHeaderActions}
                        className="h-9 w-9 flex items-center justify-center rounded-lg bg-muted/60 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
                        title={t('apiKey.add')}
                    >
                        <Plus className="size-4" />
                    </motion.button>
                    {renderHeaderExtra?.({ disabled: disabledHeaderActions, onCloseAllOverlays: closeAllOverlays })}
                </div>
            </div>

            <AnimatePresence>
                {isAdding && (
                    <APIKeyFormOverlay
                        layoutId={addLayoutId}
                        isPending={createAPIKey.isPending}
                        submitLabel={t('apiKey.form.create')}
                        onSubmit={handleCreate}
                        onClose={() => setIsAdding(false)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {viewingStats && (
                    <APIKeyStatsCard
                        layoutId={viewingStats.layoutId}
                        apiKey={viewingStats.apiKey}
                        onClose={() => setViewingStats(null)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {editingKey && (
                    <APIKeyFormOverlay
                        layoutId={editingKey.layoutId}
                        apiKey={editingKey.apiKey}
                        isPending={updateAPIKey.isPending}
                        submitLabel={t('apiKey.form.save')}
                        onSubmit={(data) => handleUpdate(editingKey.apiKey, data)}
                        onClose={() => setEditingKey(null)}
                    />
                )}
            </AnimatePresence>

            <div className={listClassName}>
                {apiKeysLoading ? (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                        <Loader className="size-4 animate-spin" />
                    </div>
                ) : apiKeysError ? (
                    <div className="h-full flex items-center justify-center text-sm text-destructive">
                        {t('apiKey.loadFailed')}
                    </div>
                ) : apiKeys?.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                        {t('apiKey.empty')}
                    </div>
                ) : (
                    <AnimatePresence>
                        {sortedApiKeys.map((apiKey) => {
                            const statsLayoutId = `${statsPrefix}-${apiKey.id}`;
                            const editLayoutId = `${editPrefix}-${apiKey.id}`;
                            const deleteLayoutId = `${deletePrefix}${apiKey.id}`;
                            return (
                                <APIKeyKeyItem
                                    key={apiKey.id}
                                    apiKey={apiKey}
                                    stats={statsByAPIKeyId.get(apiKey.id)}
                                    statsLayoutId={statsLayoutId}
                                    editLayoutId={editLayoutId}
                                    deleteLayoutId={deleteLayoutId}
                                    onViewStats={() => {
                                        closeAllOverlays();
                                        setViewingStats({ apiKey, layoutId: statsLayoutId });
                                    }}
                                    onEdit={() => {
                                        closeAllOverlays();
                                        setEditingKey({ apiKey, layoutId: editLayoutId });
                                    }}
                                    onDelete={() => handleDelete(apiKey.id)}
                                    isDeleting={deleteAPIKey.isPending && deletingId === apiKey.id}
                                />
                            );
                        })}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}

function APIKeyDialogPanel() {
    const { setIsOpen } = useMorphingDialog();
    return (
        <APIKeyPanelBase
            idPrefix="apikey-dialog"
            containerClassName="rounded-3xl border border-border bg-card p-6 space-y-5 relative w-screen max-w-full md:max-w-xl"
            listClassName="space-y-2 h-[calc(100vh-10rem)] overflow-y-auto"
            renderHeaderExtra={() => (
                <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="h-9 w-9 flex items-center justify-center rounded-lg bg-muted/60 text-muted-foreground transition-colors hover:bg-muted"
                    title="Close"
                >
                    <X className="size-4" />
                </button>
            )}
        />
    );
}

export function SettingAPIKey() {
    return (
        <APIKeyPanelBase
            idPrefix="apikey"
            containerClassName="rounded-3xl border border-border bg-card p-6 space-y-5 relative"
            listClassName="space-y-2 h-36 overflow-y-auto"
            renderHeaderExtra={() => (
                <MorphingDialog>
                    <MorphingDialogTrigger className="h-9 w-9 flex items-center justify-center rounded-lg bg-muted/60 text-muted-foreground transition-colors hover:bg-muted">
                        <Maximize2 className="size-4" />
                    </MorphingDialogTrigger>
                    <MorphingDialogContainer>
                        <MorphingDialogContent className="relative">
                            <APIKeyDialogPanel />
                        </MorphingDialogContent>
                    </MorphingDialogContainer>
                </MorphingDialog>
            )}
        />
    );
}

export function APIKeyPage() {
    return (
        <div className="h-full min-h-0 overflow-y-auto overscroll-contain rounded-t-3xl">
            <PageWrapper className="pb-24 md:pb-4">
                <APIKeyPanelBase
                    idPrefix="apikey-page"
                    containerClassName="rounded-3xl border border-border bg-card p-6 space-y-5 relative flex min-h-[32rem] flex-col"
                    listClassName="space-y-2 min-h-0 flex-1 overflow-y-auto"
                />
            </PageWrapper>
        </div>
    );
}
