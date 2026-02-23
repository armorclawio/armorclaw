'use client';

import { LogOut, Menu, Shield } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { LoginButton } from "./LoginButton";
import { SessionUser } from "@/types";
import { useTranslation } from "./LanguageProvider";
import { useSidebar } from "./SidebarProvider";

interface HeaderProps {
    user: SessionUser | null;
}

export function Header({ user }: HeaderProps) {
    const { t } = useTranslation();
    const { toggle } = useSidebar();

    return (
        <header className="h-16 border-b border-line flex items-center justify-between px-4 md:px-8 glass absolute top-0 left-0 right-0 z-10 gap-2 md:gap-6">
            <div className="flex items-center gap-3 md:hidden">
                <button
                    onClick={toggle}
                    className="p-2 -ml-2 text-ink-soft hover:text-ink transition-colors"
                    aria-label="Toggle Navigation"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                    <Shield className="text-accent w-6 h-6" />
                </div>
            </div>

            <div className="flex-1 md:hidden" />

            <div className="flex items-center gap-2 md:gap-6 ml-auto">
                <LanguageSwitcher />
                <ThemeToggle />
                {user ? (
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <img
                                src={user.image}
                                alt={user.name || 'User'}
                                className="w-8 h-8 rounded-full border-2 border-line"
                            />
                            <div className="text-sm">
                                <div className="font-medium text-ink">{user.name}</div>
                                <div className="text-ink-soft text-xs">{user.email}</div>
                            </div>
                        </div>
                        <a
                            href="/api/auth/logout"
                            className="flex items-center gap-2 bg-surface text-ink border border-line px-4 py-2 rounded-full font-medium text-sm transition-all hover:bg-line"
                        >
                            <LogOut className="w-4 h-4" />
                            {t.common.logout}
                        </a>
                    </div>
                ) : (
                    <LoginButton />
                )}
            </div>
        </header>
    );
}
