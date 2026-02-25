'use client';

import { useEffect, useState } from 'react';
import { History, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { useTranslation } from './LanguageProvider';

interface Audit {
    id: string;
    skill_name: string;
    status: string;
    score: number | null;
    created_at: string;
}

export function AuditHistory() {
    const { t, language } = useTranslation();
    const [audits, setAudits] = useState<Audit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        fetchAudits();
    }, []);

    const fetchAudits = async () => {
        try {
            const response = await fetch('/api/audits');

            if (response.status === 401) {
                // 用户未登录，显示占位符
                setAudits([]);
                setLoading(false);
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch audits');
            }

            const data = await response.json();
            setAudits(data.audits || []);
        } catch (err) {
            console.error('Error fetching audits:', err);
            setError(t.sidebar.loadError);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // 阻止触发条目点击

        if (!window.confirm(t.sidebar.deleteAuditConfirm)) {
            return;
        }

        setDeletingId(id);
        try {
            const response = await fetch(`/api/audits/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete audit');
            }

            // 更新本地状态
            setAudits(audits.filter(a => a.id !== id));
        } catch (err) {
            console.error('Error deleting audit:', err);
            alert(t.sidebar.deleteError);
        } finally {
            setDeletingId(null);
        }
    };

    // 格式化时间
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return t.sidebar.justNow;
        if (diffMins < 60) return `${diffMins}${t.sidebar.minsAgo}`;
        if (diffHours < 24) return `${diffHours}${t.sidebar.hoursAgo}`;
        if (diffDays < 7) return `${diffDays}${t.sidebar.daysAgo}`;
        return date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US');
    };

    // 获取状态颜色
    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'passed':
            case 'success':
                return 'text-success';
            case 'failed':
            case 'error':
                return 'text-error';
            case 'pending':
            case 'running':
                return 'text-warning';
            default:
                return 'text-ink-soft';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-ink-soft animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <AlertCircle className="w-8 h-8 text-error mb-2" />
                <p className="text-sm text-ink-soft">{error}</p>
            </div>
        );
    }

    if (audits.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <History className="w-8 h-8 text-ink-soft/40 mb-2" />
                <p className="text-sm text-ink-soft">{t.sidebar.noAuditHistory}</p>
                <p className="text-xs text-ink-soft/30 mt-1">{t.sidebar.submitFirstAudit}</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {audits.map((audit) => (
                <div
                    key={audit.id}
                    className="sidebar-item p-3 rounded-xl cursor-pointer group relative"
                >
                    <div className="flex items-start gap-3">
                        <History className={`w-4 h-4 mt-0.5 flex-shrink-0 ${getStatusColor(audit.status)}`} />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-ink truncate pr-6">
                                {audit.skill_name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs ${getStatusColor(audit.status)}`}>
                                    {audit.status}
                                </span>
                                {audit.score !== null && (
                                    <>
                                        <span className="text-line">•</span>
                                        <span className="text-xs text-ink-soft">
                                            {t.sidebar.scoreLabel}: {audit.score}
                                        </span>
                                    </>
                                )}
                            </div>
                            <p className="text-xs text-ink-soft/40 mt-1">
                                {formatDate(audit.created_at)}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={(e) => handleDelete(e, audit.id)}
                        disabled={deletingId === audit.id}
                        className="absolute right-2 top-3 p-1.5 text-ink-soft/30 hover:text-error opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-error/5"
                        title={t.common.delete || 'Delete'}
                    >
                        {deletingId === audit.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                        )}
                    </button>
                </div>
            ))}
        </div>
    );
}
