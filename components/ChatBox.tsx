'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from './UserProvider';
import { ChatMessages, Message } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { formatFileSize } from '@/lib/utils';
import { useTranslation } from './LanguageProvider';

interface ChatBoxProps {
    className?: string;
    selectedFile?: File | null;
    onFileSelect?: (file: File | null) => void;
    onAnalysisReady?: (auditId: string) => void;
}

export function ChatBox({ className = '', selectedFile, onFileSelect, onAnalysisReady }: ChatBoxProps) {
    const user = useUser();
    const { t } = useTranslation();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const isSendingRef = useRef(false);

    // We retain this ref but we might not need it if ChatInput handles it. 
    // Actually ChatInput handles its own ref or we pass one. 
    // In the extracted component, I put the ref inside ChatInput. That's fine.

    const router = useRouter();
    const searchParams = useSearchParams();
    const paramChatId = searchParams.get('chatId');
    const [currentChatId, setCurrentChatId] = useState(paramChatId);

    // Sync state with URL params
    useEffect(() => {
        setCurrentChatId(paramChatId);
    }, [paramChatId]);

    const LOCAL_CHATS_KEY = 'armorclaw_chats';



    // Load messages
    useEffect(() => {
        if (!currentChatId) {
            setMessages([]);
            return;
        }

        const loadMessages = async () => {
            setIsLoading(true);
            try {
                if (user) {
                    const res = await fetch(`/api/chats/${currentChatId}`);
                    if (res.ok) {
                        const data = await res.json();
                        setMessages(data.messages || []);
                    } else if (res.status === 404) {
                        router.push('/');
                    }
                } else {
                    const localMsgs = localStorage.getItem(`armorclaw_chat_messages_${currentChatId}`);
                    if (localMsgs) {
                        setMessages(JSON.parse(localMsgs));
                    }
                }
            } catch (error) {
                console.error('Failed to load messages:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadMessages();
    }, [currentChatId, user, router]);

    const updateLocalChatList = (chatId: string, firstMessage: string) => {
        try {
            const stored = localStorage.getItem(LOCAL_CHATS_KEY);
            let chats = stored ? JSON.parse(stored) : [];
            const existingIndex = chats.findIndex((c: any) => c.id === chatId);

            if (existingIndex >= 0) {
                chats[existingIndex].updated_at = new Date().toISOString();
                const chat = chats.splice(existingIndex, 1)[0];
                chats.unshift(chat);
            } else {
                const newChat = {
                    id: chatId,
                    title: firstMessage.slice(0, 30) + (firstMessage.length > 30 ? '...' : ''),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                chats.unshift(newChat);
            }
            localStorage.setItem(LOCAL_CHATS_KEY, JSON.stringify(chats));
            window.dispatchEvent(new Event('chat-updated'));
        } catch (e) {
            console.error('Failed to update local chat list', e);
        }
    };

    const saveLocalMessage = (chatId: string, newMessages: Message[]) => {
        localStorage.setItem(`armorclaw_chat_messages_${chatId}`, JSON.stringify(newMessages));
        updateLocalChatList(chatId, newMessages[0]?.content || 'New Chat');
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && onFileSelect) {
            onFileSelect(file);
        }
    };

    const handleRemoveFile = () => {
        if (onFileSelect) {
            onFileSelect(null);
        }
    };

    const handleFileAnalysis = async () => {
        if (!selectedFile) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            if (input.trim()) formData.append('notes', input.trim());

            const response = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Upload failed');

            setInput('');
            handleRemoveFile();
            if (onAnalysisReady && data.file.id) onAnalysisReady(data.file.id);
        } catch (error) {
            console.error('Upload error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `⚠️ Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                timestamp: new Date().toISOString(),
            }]);
        } finally {
            setUploading(false);
        }
    };

    const handleSend = async () => {
        if (selectedFile) {
            await handleFileAnalysis();
            return;
        }

        if (!input.trim() || isLoading || isSendingRef.current) return;

        isSendingRef.current = true;

        const userMessage: Message = {
            role: 'user',
            content: input.trim(),
            timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const conversationHistory = messages.slice(-10).map(msg => ({
                role: msg.role,
                content: msg.content,
            }));

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage.content,
                    conversationHistory,
                    chatId: currentChatId,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to send message');
            }

            const data = await response.json();
            const assistantMessage: Message = {
                role: 'assistant',
                content: data.message,
                timestamp: data.timestamp,
            };

            setMessages(prev => [...prev, assistantMessage]);

            if (!user) {
                let chatId = currentChatId;
                if (!chatId) {
                    chatId = crypto.randomUUID();
                    const url = new URL(window.location.href);
                    url.searchParams.set('chatId', chatId);
                    window.history.pushState({}, '', url.toString());
                    setCurrentChatId(chatId);
                }
                const newMsgsWithAssistant = [...messages, userMessage, assistantMessage];
                saveLocalMessage(chatId!, newMsgsWithAssistant);
            } else if (!currentChatId && data.chatId) {
                const url = new URL(window.location.href);
                url.searchParams.set('chatId', data.chatId);
                window.history.pushState({}, '', url.toString());
                setCurrentChatId(data.chatId);
                window.dispatchEvent(new Event('chat-updated'));
            } else {
                window.dispatchEvent(new Event('chat-updated'));
            }

        } catch (error) {
            console.error('Chat error:', error);
            let errorText = 'Sorry, an error occurred.';
            if (error instanceof Error) {
                if (error.message.includes('AI service not configured')) errorText = '⚠️ AI Service not configured.';
                else if (error.message.includes('Unauthorized')) errorText = '⚠️ Please login first.';
                else errorText = `⚠️ ${error.message}`;
            }
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: errorText,
                timestamp: new Date().toISOString(),
            }]);
        } finally {
            setIsLoading(false);
            isSendingRef.current = false;
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.nativeEvent.isComposing) return;
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className={`flex flex-col h-full ${className}`}>
            {/* Hero Section - Only shown when no messages */}
            {messages.length === 0 && (
                <div className="flex-none flex flex-col items-center justify-center min-h-[40vh] space-y-6 text-center animate-fade-in-up">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter gradient-text leading-tight">
                        {t.chat.heroTitle}
                    </h1>
                    <p className="text-lg font-medium text-ink-soft/80 max-w-lg mx-auto">
                        {t.chat.heroSubtitle}
                    </p>
                </div>
            )}

            {/* Chat Messages */}
            <ChatMessages messages={messages} isLoading={isLoading} />

            {/* Input Area */}
            <div className="flex-none mt-auto pt-4 pb-2 px-4">
                <ChatInput
                    input={input}
                    setInput={setInput}
                    handleSend={handleSend}
                    handleFileSelect={handleFileSelect}
                    handleRemoveFile={handleRemoveFile}
                    handleKeyPress={handleKeyPress}
                    isLoading={isLoading}
                    uploading={uploading}
                    selectedFile={selectedFile || null}
                    formatFileSize={formatFileSize}
                />

                {messages.length === 0 && !selectedFile && (
                    <div className="text-center mt-6">
                        <p className="text-ink-soft/40 text-xs font-medium tracking-widest uppercase">
                            {t.chat.readyToAnalyze}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
