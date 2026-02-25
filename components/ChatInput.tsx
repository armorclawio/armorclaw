'use client';

import { Send, Upload, File, X, Loader2, Sparkles } from 'lucide-react';
import { useRef } from 'react';
import { useTranslation } from './LanguageProvider';

interface ChatInputProps {
    input: string;
    setInput: (value: string) => void;
    handleSend: () => void;
    handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleRemoveFile: () => void;
    handleKeyPress: (e: React.KeyboardEvent) => void;
    isLoading: boolean;
    uploading: boolean;
    selectedFile: File | null;
    formatFileSize: (bytes: number) => string;
}

export function ChatInput({
    input,
    setInput,
    handleSend,
    handleFileSelect,
    handleRemoveFile,
    handleKeyPress,
    isLoading,
    uploading,
    selectedFile,
    formatFileSize
}: ChatInputProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { t } = useTranslation();

    return (
        <div className="relative w-full max-w-4xl mx-auto">
            {/* File Preview */}
            {selectedFile && (
                <div className="absolute bottom-full mb-3 left-0 right-0 mx-4 animate-slide-in-up">
                    <div className="bg-surface/80 backdrop-blur-md border border-line rounded-xl p-3 flex items-center justify-between shadow-lg ring-1 ring-black/5">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="bg-accent/10 p-2 rounded-lg shrink-0">
                                <File className="w-5 h-5 text-accent" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-medium text-ink text-sm truncate">{selectedFile.name}</p>
                                <p className="text-xs text-ink-soft">{formatFileSize(selectedFile.size)}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleRemoveFile}
                            className="p-1.5 hover:bg-line rounded-full text-ink-soft hover:text-ink transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Input Bar */}
            <div className="bg-background/80 backdrop-blur-xl border border-line rounded-2xl shadow-2xl ring-1 ring-white/10 p-2 flex items-end gap-2 transition-all focus-within:ring-accent/20 focus-within:border-accent/40">
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".c,.h,.o,.so,.elf,.bin,.zip,.tar,.gz,.tgz,.json,.yaml,.yml,.md,.txt"
                />

                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 text-ink-soft hover:text-accent hover:bg-accent/5 rounded-xl transition-all"
                    title={t.chat.uploadTip}
                >
                    <Upload className="w-5 h-5" />
                </button>

                <div className="flex-1 py-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder={selectedFile ? t.chat.fileNotes : t.chat.placeholder}
                        disabled={isLoading || uploading}
                        className="w-full bg-transparent border-none outline-none text-ink placeholder:text-ink-soft/40 text-[15px]"
                    />
                </div>

                <button
                    onClick={handleSend}
                    disabled={(selectedFile ? false : !input.trim()) || isLoading || uploading}
                    className={`p-3 rounded-xl transition-all flex items-center justify-center
                        ${(input.trim() || selectedFile) && !isLoading && !uploading
                            ? 'bg-accent text-white shadow-lg shadow-accent/20 hover:brightness-110 active:scale-95'
                            : 'bg-line/50 text-ink-soft cursor-not-allowed'
                        }`}
                >
                    {uploading || isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : selectedFile ? (
                        <Sparkles className="w-5 h-5" />
                    ) : (
                        <Send className="w-5 h-5" />
                    )}
                </button>
            </div>
        </div>
    );
}
