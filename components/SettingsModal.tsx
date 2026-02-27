'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    X,
    Database,
    Info,
    Trash2,
    Download,
    ExternalLink,
    Shield,
    CheckCircle,
    AlertTriangle,
    Loader2,
    FileJson,
    FileText,
} from 'lucide-react';
import { useTranslation } from './LanguageProvider';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Tab = 'data' | 'about';
type ExportStatus = 'idle' | 'loading' | 'success' | 'error';
type ClearStatus = 'idle' | 'confirm' | 'loading' | 'success' | 'error';

const APP_VERSION = '0.1.0';
const ANALYZER_VERSION = 'ArmorClaw Analyzer v1.0';

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<Tab>('data');
    const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');
    const [clearStatus, setClearStatus] = useState<ClearStatus>('idle');
    const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setExportStatus('idle');
            setClearStatus('idle');
            setActiveTab('data');
        }
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    const handleExport = useCallback(async (format: 'csv' | 'json') => {
        setExportStatus('loading');
        try {
            const res = await fetch(`/api/audits/export?format=${format}`);
            if (!res.ok) throw new Error('Export failed');

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `armorclaw-audits-${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);

            setExportStatus('success');
            setTimeout(() => setExportStatus('idle'), 3000);
        } catch {
            setExportStatus('error');
            setTimeout(() => setExportStatus('idle'), 3000);
        }
    }, []);

    const handleClearChat = useCallback(() => {
        if (clearStatus === 'idle') {
            setClearStatus('confirm');
            return;
        }
        if (clearStatus === 'confirm') {
            setClearStatus('loading');
            // Dispatch event to clear chat in ChatBox
            window.dispatchEvent(new Event('clear-chat-history'));
            setTimeout(() => {
                setClearStatus('success');
                setTimeout(() => setClearStatus('idle'), 3000);
            }, 600);
        }
    }, [clearStatus]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-[var(--color-surface)] border border-[var(--color-line)] rounded-2xl shadow-2xl overflow-hidden animate-in">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-line)]">
                    <div className="flex items-center gap-2.5">
                        <Shield className="w-5 h-5 text-accent" />
                        <h2 className="text-base font-semibold text-[var(--color-ink)]">
                            {t.common.settings}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-line)] transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[var(--color-line)] px-6">
                    <TabButton
                        active={activeTab === 'data'}
                        icon={<Database className="w-3.5 h-3.5" />}
                        label={t.settings.tabs.data}
                        onClick={() => setActiveTab('data')}
                    />
                    <TabButton
                        active={activeTab === 'about'}
                        icon={<Info className="w-3.5 h-3.5" />}
                        label={t.settings.tabs.about}
                        onClick={() => setActiveTab('about')}
                    />
                </div>

                {/* Content */}
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    {activeTab === 'data' && (
                        <DataTab
                            t={t}
                            exportStatus={exportStatus}
                            exportFormat={exportFormat}
                            clearStatus={clearStatus}
                            onExport={handleExport}
                            setExportFormat={setExportFormat}
                            onClearChat={handleClearChat}
                            onCancelClear={() => setClearStatus('idle')}
                        />
                    )}
                    {activeTab === 'about' && <AboutTab t={t} />}
                </div>
            </div>

            <style>{`
                @keyframes animate-in {
                    from { opacity: 0; transform: scale(0.95) translateY(8px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
                .animate-in { animation: animate-in 0.18s ease-out; }
            `}</style>
        </div>
    );
}

/* ─── Sub-components ──────────────────────────────────────────── */

function TabButton({
    active, icon, label, onClick,
}: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${active
                    ? 'border-accent text-accent'
                    : 'border-transparent text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]'
                }`}
        >
            {icon}
            {label}
        </button>
    );
}

function SectionCard({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-[var(--color-background)] border border-[var(--color-line)] rounded-xl p-4 space-y-3">
            {children}
        </div>
    );
}

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-ink-soft)] uppercase tracking-wider">
            {icon}
            {label}
        </div>
    );
}

function DataTab({
    t, exportStatus, exportFormat, clearStatus,
    onExport, setExportFormat, onClearChat, onCancelClear,
}: {
    t: any;
    exportStatus: ExportStatus;
    exportFormat: 'csv' | 'json';
    clearStatus: ClearStatus;
    onExport: (f: 'csv' | 'json') => void;
    setExportFormat: (f: 'csv' | 'json') => void;
    onClearChat: () => void;
    onCancelClear: () => void;
}) {
    return (
        <div className="space-y-4">
            {/* Export Audit Logs */}
            <SectionCard>
                <SectionTitle
                    icon={<Download className="w-3.5 h-3.5" />}
                    label={t.settings.data.exportTitle}
                />
                <p className="text-xs text-[var(--color-ink-soft)]">
                    {t.settings.data.exportDesc}
                </p>

                {/* Format selector */}
                <div className="flex gap-2">
                    <FormatButton
                        active={exportFormat === 'csv'}
                        icon={<FileText className="w-3.5 h-3.5" />}
                        label="CSV"
                        onClick={() => setExportFormat('csv')}
                    />
                    <FormatButton
                        active={exportFormat === 'json'}
                        icon={<FileJson className="w-3.5 h-3.5" />}
                        label="JSON"
                        onClick={() => setExportFormat('json')}
                    />
                </div>

                <button
                    onClick={() => onExport(exportFormat)}
                    disabled={exportStatus === 'loading'}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                >
                    {exportStatus === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
                    {exportStatus === 'success' && <CheckCircle className="w-4 h-4" />}
                    {exportStatus === 'error' && <AlertTriangle className="w-4 h-4" />}
                    {exportStatus === 'idle' && <Download className="w-4 h-4" />}
                    {exportStatus === 'idle' && t.settings.data.exportBtn}
                    {exportStatus === 'loading' && t.settings.data.exporting}
                    {exportStatus === 'success' && t.settings.data.exportSuccess}
                    {exportStatus === 'error' && t.settings.data.exportError}
                </button>
            </SectionCard>

            {/* Clear Chat History */}
            <SectionCard>
                <SectionTitle
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                    label={t.settings.data.clearTitle}
                />
                <p className="text-xs text-[var(--color-ink-soft)]">
                    {t.settings.data.clearDesc}
                </p>

                {clearStatus === 'confirm' ? (
                    <div className="space-y-2">
                        <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                                {t.settings.data.clearConfirm}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={onCancelClear}
                                className="flex-1 px-4 py-2 border border-[var(--color-line)] text-[var(--color-ink-soft)] rounded-xl text-sm font-medium hover:bg-[var(--color-line)] transition-colors"
                            >
                                {t.common.cancel}
                            </button>
                            <button
                                onClick={onClearChat}
                                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors"
                            >
                                {t.settings.data.clearConfirmBtn}
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={onClearChat}
                        disabled={clearStatus === 'loading'}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${clearStatus === 'success'
                                ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                                : clearStatus === 'error'
                                    ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                    : 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20'
                            } disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                        {clearStatus === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
                        {clearStatus === 'success' && <CheckCircle className="w-4 h-4" />}
                        {clearStatus === 'idle' && <Trash2 className="w-4 h-4" />}
                        {clearStatus === 'idle' && t.settings.data.clearBtn}
                        {clearStatus === 'loading' && t.settings.data.clearing}
                        {clearStatus === 'success' && t.settings.data.clearSuccess}
                        {clearStatus === 'error' && t.settings.data.clearError}
                    </button>
                )}
            </SectionCard>
        </div>
    );
}

function FormatButton({
    active, icon, label, onClick,
}: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${active
                    ? 'bg-accent/10 text-accent border-accent/30'
                    : 'border-[var(--color-line)] text-[var(--color-ink-soft)] hover:border-accent/30 hover:text-accent'
                }`}
        >
            {icon}
            {label}
        </button>
    );
}

function AboutTab({ t }: { t: any }) {
    return (
        <div className="space-y-4">
            {/* App Info */}
            <SectionCard>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                        <Shield className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                        <div className="font-semibold text-[var(--color-ink)]">ArmorClaw</div>
                        <div className="text-xs text-[var(--color-ink-soft)]">AI + eBPF Security Audit</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                    <InfoRow label={t.settings.about.appVersion} value={`v${APP_VERSION}`} />
                    <InfoRow label={t.settings.about.analyzerVersion} value={ANALYZER_VERSION} />
                </div>
            </SectionCard>

            {/* Links */}
            <SectionCard>
                <SectionTitle
                    icon={<ExternalLink className="w-3.5 h-3.5" />}
                    label={t.settings.about.linksTitle}
                />
                <div className="space-y-1">
                    <LinkRow
                        label={t.settings.about.website}
                        href="https://armorclaw.io"
                    />
                    <LinkRow
                        label={t.settings.about.docs}
                        href="https://armorclaw.io/docs"
                    />
                    <LinkRow
                        label={t.settings.about.github}
                        href="https://github.com/armorclaw"
                    />
                </div>
            </SectionCard>

            {/* Legal */}
            <p className="text-center text-xs text-[var(--color-ink-soft)]/50">
                {t.settings.about.copyright}
            </p>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-[var(--color-surface)] rounded-lg p-2.5">
            <div className="text-[10px] text-[var(--color-ink-soft)] uppercase tracking-wider mb-0.5">{label}</div>
            <div className="text-xs font-mono font-medium text-[var(--color-ink)]">{value}</div>
        </div>
    );
}

function LinkRow({ label, href }: { label: string; href: string }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[var(--color-surface)] transition-colors group"
        >
            <span className="text-sm text-[var(--color-ink-soft)] group-hover:text-[var(--color-ink)] transition-colors">
                {label}
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-[var(--color-ink-soft)]/40 group-hover:text-accent transition-colors" />
        </a>
    );
}
