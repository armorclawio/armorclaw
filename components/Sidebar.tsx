'use client';

import { Shield, History, Settings } from "lucide-react";
import { ChatHistoryList } from "./ChatHistoryList";
import { AuditHistory } from "./AuditHistory";
import { SessionUser } from "@/types";
import { useTranslation } from "./LanguageProvider";

interface SidebarProps {
    user: SessionUser | null;
}

export function Sidebar({ user }: SidebarProps) {
    const { t } = useTranslation();

    return (
        <aside className="w-64 border-r border-line flex flex-col glass z-10 h-full">
            <div className="p-6 flex items-center gap-3 border-b border-line shrink-0">
                <Shield className="text-accent w-8 h-8" />
                <span className="font-bold text-xl tracking-tight text-ink">ArmorClaw</span>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-6">
                <div>
                    <div className="text-xs font-semibold text-ink-soft uppercase tracking-wider mb-2 px-2 flex items-center gap-2">
                        <History className="w-3 h-3" />
                        {t.sidebar.conversations}
                    </div>
                    <ChatHistoryList user={user} />
                </div>

                <div>
                    <div className="text-xs font-semibold text-ink-soft uppercase tracking-wider mb-2 px-2">{t.sidebar.auditLogs}</div>
                    <AuditHistory />
                </div>
            </nav>

            <div className="p-4 border-t border-line space-y-2 shrink-0">
                <div className="sidebar-item p-3 rounded-xl cursor-pointer flex items-center gap-3 text-ink-soft hover:text-ink transition-colors">
                    <Settings className="w-4 h-4" />
                    <span className="text-sm font-medium">{t.common.settings}</span>
                </div>
            </div>
        </aside>
    );
}
