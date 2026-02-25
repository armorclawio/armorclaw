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
    Clock
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-ink flex items-center gap-2">
                        <Shield className="w-6 h-6 text-accent" />
                        {t.report.title}
                    </h2>
                    <p className="text-ink-soft/60 text-sm mt-1">{result.metadata.file_name}</p>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-ink-soft hover:text-ink transition-colors"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Score Card */}
            <div className="relative overflow-hidden rounded-2xl bg-surface border border-line p-6 shadow-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-20 blur-2xl"
                    style={{ background: `linear-gradient(135deg, ${result.score >= 90 ? '#10b981' : result.score >= 70 ? '#f59e0b' : '#ef4444'}, transparent)` }} />

                <div className="relative flex items-center justify-between">
                    <div>
                        <p className="text-ink-soft text-sm font-medium mb-2">{t.report.scoreTitle}</p>
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
