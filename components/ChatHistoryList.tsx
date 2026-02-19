'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Plus, Trash2, Loader2, History } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Chat {
    id: string;
    title: string;
    created_at: string;
}

import { SessionUser } from '@/types';
import { useTranslation } from './LanguageProvider';

interface ChatHistoryListProps {
    user: SessionUser | null;
}

export function ChatHistoryList({ user }: ChatHistoryListProps) {
    const { t, language } = useTranslation();
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentChatId = searchParams.get('chatId');

    const LOCAL_STORAGE_KEY = 'armorclaw_chats';

    useEffect(() => {
        if (user) {
            fetchChats();
        } else {
            loadLocalChats();
        }
    }, [user]);

    // Listen for new chats (from other components)
    useEffect(() => {
        const handleStorageChange = () => {
            if (!user) loadLocalChats();
        };

        // Custom event for chat updates
        const handleChatUpdate = () => {
            if (user) fetchChats();
            else loadLocalChats();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('chat-updated', handleChatUpdate);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('chat-updated', handleChatUpdate);
        };
    }, [user]);

    const fetchChats = async () => {
        try {
            const response = await fetch('/api/chats');
            if (response.ok) {
                const data = await response.json();
                setChats(data.chats || []);
            }
        } catch (error) {
            console.error('Failed to fetch chats:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadLocalChats = () => {
        try {
            const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Sort by created_at desc
                const sorted = Array.isArray(parsed) ? parsed.sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                ) : [];
                setChats(sorted);
            } else {
                setChats([]);
            }
        } catch (e) {
            console.error('Failed to load local chats', e);
            setChats([]);
        } finally {
            setLoading(false);
        }
    };

    const handleNewChat = () => {
        router.push('/');
    };

    const handleSelectChat = (chatId: string) => {
        router.push(`/?chatId=${chatId}`);
    };

    const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
        e.stopPropagation();
        if (!confirm(t.sidebar.deleteConfirm)) return;

        if (user) {
            try {
                await fetch(`/api/chats/${chatId}`, { method: 'DELETE' });
                fetchChats();
                if (currentChatId === chatId) {
                    router.push('/');
                }
            } catch (error) {
                console.error('Failed to delete chat:', error);
            }
        } else {
            const updated = chats.filter(c => c.id !== chatId);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
            // Also need to remove messages for this chat if stored separately?
            // For simple local storage, maybe we store all messages in 'armorclaw_chat_messages_{id}'
            localStorage.removeItem(`armorclaw_chat_messages_${chatId}`);
            setChats(updated);
            if (currentChatId === chatId) {
                router.push('/');
            }
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffDays === 0) return t.sidebar.today;
        if (diffDays === 1) return t.sidebar.yesterday;
        if (diffDays < 7) return `${diffDays}${t.sidebar.daysAgo}`;
        return date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US');
    };

    if (loading) {
        return (
            <div className="flex justify-center p-4">
                <Loader2 className="w-4 h-4 text-ink-soft/40 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="px-4 mb-2">
                <button
                    onClick={handleNewChat}
                    className="w-full flex items-center gap-2 bg-accent/10 hover:bg-accent/20 text-accent px-3 py-2 rounded-lg transition-colors text-sm font-medium border border-accent/20"
                >
                    <Plus className="w-4 h-4" />
                    {t.chat.newChat}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 space-y-1">
                {chats.length === 0 ? (
                    <div className="text-center py-8 text-ink-soft/40 text-xs">
                        <History className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p>{t.sidebar.noHistory}</p>
                    </div>
                ) : (
                    chats.map((chat) => (
                        <div
                            key={chat.id}
                            onClick={() => handleSelectChat(chat.id)}
                            className={`group flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${currentChatId === chat.id
                                ? 'bg-surface text-ink shadow-sm'
                                : 'text-ink-soft hover:bg-line/50 hover:text-ink'
                                }`}
                        >
                            <MessageSquare className="w-4 h-4 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm truncate">{chat.title || t.chat.newChat}</p>
                                <p className="text-[10px] opacity-50">{formatDate(chat.created_at)}</p>
                            </div>
                            <button
                                onClick={(e) => handleDeleteChat(e, chat.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-error transition-opacity"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
