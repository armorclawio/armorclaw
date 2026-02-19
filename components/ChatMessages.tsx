'use client';

import { Sparkles, Loader2 } from 'lucide-react';
import { useRef, useEffect } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useTranslation } from './LanguageProvider';

export interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

interface ChatMessagesProps {
    messages: Message[];
    isLoading: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
    const { t, language } = useTranslation();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    if (messages.length === 0) return null;

    return (
        <div className="flex-1 overflow-y-auto mb-4 space-y-6 p-4">
            {messages.map((msg, idx) => (
                <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                    <div
                        className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-3.5 shadow-sm transition-all ${msg.role === 'user'
                            ? 'bg-accent text-white rounded-br-none'
                            : 'bg-surface text-ink border border-line rounded-bl-none'
                            }`}
                    >
                        {msg.role === 'assistant' && (
                            <div className="flex items-center gap-2 mb-2 text-accent/80 pb-2 border-b border-line/50">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span className="text-xs font-bold uppercase tracking-wider">ArmorClaw AI</span>
                            </div>
                        )}
                        <div className="text-sm leading-relaxed break-words">
                            <MarkdownRenderer content={msg.content} />
                        </div>
                        <div className={`text-[10px] mt-2 opacity-50 text-right ${msg.role === 'user' ? 'text-white' : 'text-ink-soft'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </div>
            ))}

            {isLoading && (
                <div className="flex justify-start animate-fade-in">
                    <div className="bg-surface text-ink border border-line rounded-2xl rounded-bl-none px-5 py-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <Loader2 className="w-4 h-4 animate-spin text-accent" />
                            <span className="text-sm font-medium text-ink-soft">{t.chat.thinking}</span>
                        </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
    );
}
