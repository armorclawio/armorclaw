'use client';

import { use } from 'react';
import { AnalysisResultView } from "@/components/AnalysisResultView";
import { ShieldCheck } from "lucide-react";
import { useTranslation } from "@/components/LanguageProvider";
import Link from 'next/link';

export default function AuditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { t } = useTranslation();

    // Set page title
    if (typeof document !== 'undefined') {
        document.title = `${t.report.title} | ArmorClaw`;
    }

    return (
        <div className="h-full w-full flex flex-col items-center p-4 md:p-8 relative overflow-hidden bg-background">
            {/* Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-72 md:w-96 h-72 md:h-96 bg-amber-400/10 dark:bg-purple-600/10 rounded-full blur-[128px]" />
            <div className="absolute bottom-1/4 right-1/4 w-72 md:w-96 h-72 md:h-96 bg-orange-500/10 dark:bg-violet-600/10 rounded-full blur-[128px]" />

            <div className="max-w-4xl w-full h-full flex flex-col z-10 relative">
                <div className="mb-8 flex items-center justify-between">
                    <Link
                        href="/"
                        className="text-sm text-ink-soft hover:text-ink transition-colors flex items-center gap-2"
                    >
                        ← {t.common.backToHome || 'Back to Home'}
                    </Link>

                    <div className="flex items-center gap-4 text-[10px] font-semibold text-ink-soft/30 uppercase tracking-[0.2em]">
                        <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> {t.common.staticAnalysis}</span>
                        <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> {t.common.runtimeAudit}</span>
                    </div>
                </div>

                <div className="bg-surface border border-line rounded-3xl p-6 md:p-8 shadow-2xl overflow-y-auto">
                    <AnalysisResultView auditId={id} />
                </div>
            </div>
        </div>
    );
}
