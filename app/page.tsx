'use client';

import { useState } from 'react';
import { Suspense } from 'react';
import { ShieldCheck } from "lucide-react";
import { AnalysisResultView } from "@/components/AnalysisResultView";
import { ChatBox } from "@/components/ChatBox";
import { useTranslation } from "@/components/LanguageProvider";

export default function Home() {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [currentAuditId, setCurrentAuditId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { t } = useTranslation();

  const handleAnalysisReady = (auditId: string) => {
    setCurrentAuditId(auditId);
    setShowAnalysis(true);
    setSelectedFile(null); // 清除已选择的文件
  };

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
  };

  return (
    <div className="h-full w-full flex flex-col items-center p-4 md:p-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-72 md:w-96 h-72 md:h-96 bg-amber-400/20 dark:bg-purple-600/20 rounded-full blur-[128px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-72 md:w-96 h-72 md:h-96 bg-orange-500/20 dark:bg-violet-600/20 rounded-full blur-[128px] animate-pulse" />

      <div className="max-w-3xl w-full h-full flex flex-col z-10 relative">
        {/* AI Chat Box with integrated file upload */}
        {/* AI Chat Box with integrated file upload */}
        <Suspense fallback={<div className="h-32 w-full bg-surface/40 rounded-2xl animate-pulse" />}>
          <ChatBox
            className="flex-1 min-h-0"
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            onAnalysisReady={handleAnalysisReady}
          />
        </Suspense>

        <div className="mt-4 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 text-xs font-semibold text-ink-soft/30 uppercase tracking-[0.2em]">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> {t.common.staticAnalysis}</span>
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> {t.common.runtimeAudit}</span>
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> {t.common.scoreGeneration}</span>
        </div>

        {/* Analysis Result Section */}
        {showAnalysis && currentAuditId && (
          <div className="space-y-4 mt-8 mb-8">
            <div className="bg-surface border border-line rounded-2xl p-6 overflow-y-auto max-h-[80vh]">
              <AnalysisResultView
                auditId={currentAuditId}
                onClose={() => setShowAnalysis(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

