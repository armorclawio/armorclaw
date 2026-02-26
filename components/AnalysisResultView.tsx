'use client';

import { useEffect, useState } from 'react';
import {
    CheckCircle,
    AlertTriangle,
    XCircle,
    Loader2,
    Shield,
    TrendingUp,
    FileText,
    Clock,
    Link2,
    Globe,
    Lock,
    DownloadCloud,
    Box,
    Star,
    Share2,
    ExternalLink,
    BadgeCheck
} from 'lucide-react';
import { AnalysisResult } from '@/types';
import { formatDate } from '@/lib/utils';
import { useTranslation } from './LanguageProvider';

interface AnalysisResultViewProps {
    auditId: string;
    onClose?: () => void;
}

export function AnalysisResultView({ auditId, onClose }: AnalysisResultViewProps) {
    const { t, language } = useTranslation();
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isUpdatingPublic, setIsUpdatingPublic] = useState(false);

    useEffect(() => {
        fetchAnalysisResult();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auditId]);

    const fetchAnalysisResult = async () => {
        try {
            setLoading(true);

            // First try to GET the result
            let response = await fetch(`/api/analysis/${auditId}`);

            // Handle unauthorized (guest users)
            if (response.status === 401) {
                throw new Error('请登录后查看分析结果');
            }

            let data = await response.json();

            // If analysis is pending or not found, trigger it via POST
            if (!response.ok || data.status === 'pending' || (data.message && data.message.includes('pending'))) {
                console.log('Analysis pending or not found, triggering new analysis...');
                response = await fetch(`/api/analysis/${auditId}`, { method: 'POST' });

                if (response.status === 401) {
                    throw new Error('请登录后查看分析结果');
                }

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Analysis failed: ${errorText}`);
                }

                data = await response.json();

                // POST response has structure: { success, result, usedAI }
                if (data.result) {
                    data = data.result;
                }
            }

            if (data.error) {
                throw new Error(data.error);
            }

            setResult(data);
        } catch (err) {
            console.error('Fetch analysis error:', err);
            setError(err instanceof Error ? err.message : t.report.loadError);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = () => {
        const url = `${window.location.origin}/audits/${auditId}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleTogglePublic = async () => {
        if (!result || !result.is_owner || isUpdatingPublic) return;

        const newStatus = !result.is_public;
        setIsUpdatingPublic(true);

        try {
            const response = await fetch(`/api/audits/${auditId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPublic: newStatus }),
            });

            if (!response.ok) throw new Error('Failed to update status');

            setResult({ ...result, is_public: newStatus });
        } catch (err) {
            console.error('Update public status error:', err);
            alert('无法更新公开状态');
        } finally {
            setIsUpdatingPublic(false);
        }
    };

    const handleDownloadSkill = () => {
        if (!result) return;
        // 使用新创建的 API 下载原始文件
        window.open(`/api/audits/${auditId}/file`, '_blank');
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'passed':
                return <CheckCircle className="w-5 h-5 text-success" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-warning" />;
            case 'critical':
            case 'failed':
                return <XCircle className="w-5 h-5 text-error" />;
            default:
                return <CheckCircle className="w-5 h-5 text-ink-soft/40" />;
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-success';
        if (score >= 70) return 'text-warning';
        return 'text-error';
    };

    const getScoreGradient = (score: number) => {
        if (score >= 90) return 'from-success to-success';
        if (score >= 70) return 'from-warning to-warning';
        return 'from-error to-error';
    };



    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
        );
    }

    if (error || !result) {
        return (
            <div className="text-center py-12">
                <XCircle className="w-12 h-12 text-error mx-auto mb-4" />
                <p className="text-ink-soft">{error || t.report.loadError}</p>
            </div>
        );
    }

    const fileName = result.metadata.file_name;
    const baseName = fileName.includes('.') ? fileName.split('.').slice(0, -1).join('.') : fileName;

    return (
        <div className="space-y-8 relative">
            {/* Marketplace-style Header */}
            <div className="flex flex-col md:flex-row gap-8 mb-4 items-start relative px-2">
                <div className="relative shrink-0">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-gradient-to-br from-accent/20 to-accent/5 border border-line flex items-center justify-center shadow-inner group relative overflow-hidden">
                        <Shield className="w-16 h-16 md:w-20 md:h-20 text-accent group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-accent/10 to-transparent" />
                        <div className="absolute inset-0 border-[8px] border-white/5 rounded-3xl" />
                    </div>

                    {/* Circular Stamp Overlay (Riding Seal Style) */}
                    {result.score >= 60 && (
                        <div className="absolute top-1/2 -right-16 md:-right-20 -translate-y-1/2 pointer-events-none select-none z-50 animate-stamp scale-75 md:scale-100">
                            <div className="border-[6px] border-double border-success/40 text-success/40 w-32 h-32 md:w-44 md:h-44 rounded-full font-black flex flex-col items-center justify-center leading-none bg-success/10 backdrop-blur-[1px] relative shadow-[0_0_30px_rgba(22,163,74,0.15)] ring-4 ring-background/50">
                                <div className="absolute inset-2 border-2 border-success/20 rounded-full" />
                                <span className="text-[8px] md:text-[10px] mb-2 font-bold tracking-[0.3em] text-success/60 uppercase">{t.report.officialSeal}</span>
                                <div className="text-center px-4 flex flex-col items-center">
                                    <span className="text-sm md:text-xl tracking-tighter mb-1 uppercase opacity-80">{t.report.passedStamp.split(' ')[0]}</span>
                                    <span className="text-lg md:text-2xl tracking-widest uppercase">{t.report.passedStamp.split(' ').slice(1).join(' ')}</span>
                                </div>
                                <div className="w-1/2 h-[1px] bg-success/30 my-2" />
                                <span className="text-[8px] md:text-[10px] font-mono opacity-60">{result.metadata.analyzer_version}</span>
                                {/* Subtle inner decorative ring */}
                                <div className="absolute inset-0 rounded-full border border-success/5 m-1" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl md:text-5xl font-black text-ink tracking-tighter mb-2 flex flex-wrap items-center gap-3 uppercase">
                                {baseName}
                                <span className="bg-accent/10 text-accent text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border border-accent/20">
                                    AGENT READY
                                </span>
                            </h1>
                            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs md:text-sm text-ink-soft/60">
                                <span className="flex items-center gap-1.5 hover:text-accent cursor-pointer transition-colors">
                                    <span className="font-semibold text-ink-soft">{t.report.publisher}</span>
                                    <BadgeCheck className="w-4 h-4 text-accent fill-accent/20" />
                                </span>
                                <span className="w-1 h-1 bg-line rounded-full" />
                                <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4].map(i => (
                                        <Star key={i} className="w-3.5 h-3.5 text-warning fill-warning" />
                                    ))}
                                    <Star className="w-3.5 h-3.5 text-warning/40 fill-warning/40" />
                                    <span className="ml-1.5 font-medium text-ink-soft">(4.9)</span>
                                </div>
                                <span className="w-1 h-1 bg-line rounded-full" />
                                <span className="flex items-center gap-1.5">
                                    <DownloadCloud className="w-3.5 h-3.5" />
                                    128k+ {t.report.downloads}
                                </span>
                                <span className="w-1 h-1 bg-line rounded-full" />
                                <span className="flex items-center gap-1.5">v{result.metadata.analyzer_version}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {result.is_owner && (
                                <button
                                    onClick={handleTogglePublic}
                                    disabled={isUpdatingPublic}
                                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-all rounded-xl border ${result.is_public
                                        ? 'bg-success/10 text-success border-success/20 hover:bg-success/20'
                                        : 'text-ink-soft hover:text-ink border-line hover:bg-line'
                                        }`}
                                    title={result.is_public ? t.report.isPublic : t.report.makePublic}
                                >
                                    {isUpdatingPublic ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : result.is_public ? (
                                        <Globe className="w-3.5 h-3.5" />
                                    ) : (
                                        <Lock className="w-3.5 h-3.5" />
                                    )}
                                    {result.is_public ? t.report.isPublic : t.report.makePublic}
                                </button>
                            )}
                            <button
                                onClick={handleCopyLink}
                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-ink-soft hover:text-accent hover:bg-accent/10 transition-all rounded-xl border border-line"
                                title={t.report.copyLink}
                            >
                                <Link2 className="w-3.5 h-3.5" />
                                {copied ? t.report.linkCopied : t.report.copyLink}
                            </button>
                            {onClose && (
                                <button
                                    onClick={onClose}
                                    className="p-2 text-ink-soft hover:text-ink hover:bg-line transition-all rounded-xl"
                                >
                                    <XCircle className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={handleDownloadSkill}
                            className="bg-accent hover:bg-accent/90 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-accent/20 transition-all active:scale-95 group"
                        >
                            <DownloadCloud className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                            {t.report.downloadSkill}
                        </button>
                    </div>
                </div>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-line to-transparent opacity-50" />

            {/* Score Card */}
            <div className="relative overflow-hidden rounded-2xl bg-surface border border-line p-6 shadow-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-20 blur-2xl"
                    style={{ background: `linear-gradient(135deg, ${result.score >= 90 ? '#10b981' : result.score >= 70 ? '#f59e0b' : '#ef4444'}, transparent)` }} />

                <div className="relative flex items-center justify-between">
                    <div>
                        <p className="text-ink-soft/40 text-[10px] font-bold uppercase tracking-widest mb-1">{t.report.title}</p>
                        <p className="text-ink-soft text-sm font-semibold mb-2">{t.report.scoreTitle}</p>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-5xl font-black ${getScoreColor(result.score)}`}>
                                {result.score}
                            </span>
                            <span className="text-ink-soft/40 text-xl">/100</span>
                        </div>
                        <p className="text-ink-soft text-sm mt-2 font-medium">
                            {result.status === 'passed' && `✅ ${t.report.passed}`}
                            {result.status === 'warning' && `⚠️ ${t.report.warning}`}
                            {result.status === 'failed' && `❌ ${t.report.failed}`}
                        </p>
                    </div>

                    <div className="text-right space-y-2">
                        <div className="flex items-center gap-2 text-sm justify-end">
                            <CheckCircle className="w-4 h-4 text-success" />
                            <span className="text-ink-soft">{t.report.passedCount}: {result.summary.passed}</span>
                        </div>
                        {result.summary.warnings > 0 && (
                            <div className="flex items-center gap-2 text-sm justify-end">
                                <AlertTriangle className="w-4 h-4 text-warning" />
                                <span className="text-ink-soft">{t.report.warningCount}: {result.summary.warnings}</span>
                            </div>
                        )}
                        {result.summary.critical > 0 && (
                            <div className="flex items-center gap-2 text-sm justify-end">
                                <XCircle className="w-4 h-4 text-error" />
                                <span className="text-ink-soft">{t.report.criticalCount}: {result.summary.critical}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Checks */}
            <div className="space-y-3">
                <h3 className="text-lg font-semibold text-ink flex items-center gap-2">
                    <FileText className="w-5 h-5 text-accent" />
                    {t.report.detailsTitle}
                </h3>
                <div className="space-y-2">
                    {result.checks.map((check, index) => (
                        <div
                            key={index}
                            className="bg-surface border border-line rounded-xl p-4 hover:bg-line/50 transition-all shadow-sm"
                        >
                            <div className="flex items-start gap-3">
                                {getStatusIcon(check.status)}
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-medium text-ink">{check.category}</h4>
                                        <span className={`text-xs px-2 py-1 rounded-full ${check.severity === 'critical' ? 'bg-error/20 text-error' :
                                            check.severity === 'warning' ? 'bg-warning/20 text-warning' :
                                                'bg-success/20 text-success'
                                            }`}>
                                            {check.severity === 'critical' ? t.report.criticalCount : check.severity === 'warning' ? t.report.warningCount : t.report.normalCount}
                                        </span>
                                    </div>
                                    <p className="text-sm text-ink-soft">{check.details}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-ink flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-accent" />
                        {t.report.recommendationsTitle}
                    </h3>
                    <div className="bg-accent/5 border border-accent/10 rounded-xl p-4">
                        <ul className="space-y-2">
                            {result.recommendations.map((rec, index) => (
                                <li key={index} className="text-sm text-ink-soft flex items-start gap-2">
                                    <span className="text-accent mt-1">•</span>
                                    <span>{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Metadata */}
            <div className="flex items-center justify-between text-xs text-ink-soft/60 pt-4 border-t border-line">
                <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{t.report.analysisTime}: {new Date(result.metadata.analyzed_at).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US')}</span>
                </div>
                <span>{t.report.analyzerVersion}: {result.metadata.analyzer_version}</span>
            </div>
        </div>
    );
}
