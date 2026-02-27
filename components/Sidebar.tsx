'use client';

import { useState } from "react";
import { Shield, History, Settings, ShoppingBag, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuditHistory } from "./AuditHistory";
import { SettingsModal } from "./SettingsModal";
import { SessionUser } from "@/types";
import { useTranslation } from "./LanguageProvider";
import { useSidebar } from "./SidebarProvider";

interface SidebarProps {
    user: SessionUser | null;
}

export function Sidebar({ user }: SidebarProps) {
    const { t } = useTranslation();
    const { isOpen, setIsOpen } = useSidebar();
    const router = useRouter();
    const [settingsOpen, setSettingsOpen] = useState(false);

    const handleNewAudit = () => {
        window.dispatchEvent(new Event('new-audit'));
        if (window.location.pathname !== '/') {
            router.push('/');
        }
    };

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-200"
                    onClick={() => setIsOpen(false)}
                />
            )}
            <aside className={`fixed md:relative inset-y-0 left-0 transform ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 transition-transform duration-200 ease-in-out w-64 border-r border-line flex flex-col glass z-50 md:z-10 h-full bg-background/95 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none`}>
                <Link href="/" className="p-6 flex items-center gap-3 border-b border-line shrink-0 cursor-pointer hover:bg-surface/50 transition-colors">
                    <Shield className="text-accent w-8 h-8" />
                    <span className="font-bold text-xl tracking-tight text-ink">ArmorClaw</span>
                </Link>

                <nav className="flex-1 overflow-y-auto p-4 space-y-6">
                    <div className="space-y-2">
                        <Link href="/market" className="block">
                            <div className="sidebar-item p-3 rounded-xl cursor-pointer flex items-center gap-3 text-ink-soft hover:text-ink transition-colors bg-accent/5 border border-accent/10">
                                <ShoppingBag className="w-4 h-4 text-accent" />
                                <span className="text-sm font-semibold">{t.market.title}</span>
                            </div>
                        </Link>

                        <button
                            onClick={handleNewAudit}
                            className="w-full sidebar-item p-3 rounded-xl cursor-pointer flex items-center gap-3 text-accent hover:bg-accent/10 transition-colors border border-accent/20 bg-accent/5"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="text-sm font-semibold">{t.sidebar.newAudit}</span>
                        </button>
                    </div>

                    <div>
                        <div className="text-xs font-semibold text-ink-soft uppercase tracking-wider mb-2 px-2 flex items-center gap-2">
                            <History className="w-3 h-3" />
                            {t.sidebar.auditLogs}
                        </div>
                        <AuditHistory />
                    </div>
                </nav>

                <div className="p-4 border-t border-line space-y-2 shrink-0">
                    <button
                        onClick={() => setSettingsOpen(true)}
                        className="w-full sidebar-item p-3 rounded-xl cursor-pointer flex items-center gap-3 text-ink-soft hover:text-ink transition-colors"
                    >
                        <Settings className="w-4 h-4" />
                        <span className="text-sm font-medium">{t.common.settings}</span>
                    </button>
                </div>
            </aside>

            <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </>
    );
}
