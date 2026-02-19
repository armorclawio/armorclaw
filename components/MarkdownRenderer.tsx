
import React from 'react';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
    if (!content) return null;

    // Split content by code blocks first
    const parts = content.split(/(```[\s\S]*?```)/g);

    return (
        <div className={`markdown-content ${className}`}>
            {parts.map((part, index) => {
                // If it's a code block
                if (part.startsWith('```') && part.endsWith('```')) {
                    const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
                    if (match) {
                        const [, lang, code] = match;
                        return (
                            <pre key={index} className="bg-black/30 text-xs md:text-sm p-4 rounded-lg overflow-x-auto my-3 border border-white/10 font-mono">
                                {lang && <div className="text-white/40 text-[10px] uppercase mb-1">{lang}</div>}
                                <code>{code.trim()}</code>
                            </pre>
                        );
                    }
                }

                // If it's normal text, process inline styles
                // Split by double newlines for paragraphs
                const paragraphs = part.split(/\n\n+/);

                return (
                    <div key={index} className="inline">
                        {paragraphs.map((p, pIdx) => {
                            // Process inline formatting: **bold**, `code`
                            // Simplified parsing: split by backticks, then asterisks

                            // 1. Split by backticks
                            const codeParts = p.split(/(`[^`]+`)/g);

                            const renderedParagraph = codeParts.map((cp, cpIdx) => {
                                if (cp.startsWith('`') && cp.endsWith('`')) {
                                    return <code key={cpIdx} className="bg-black/20 text-accent px-1.5 py-0.5 rounded text-xs font-mono">{cp.slice(1, -1)}</code>;
                                }

                                // 2. Split by bold
                                const boldParts = cp.split(/(\*\*[^*]+\*\*)/g);
                                return boldParts.map((bp, bpIdx) => {
                                    if (bp.startsWith('**') && bp.endsWith('**')) {
                                        return <strong key={`${cpIdx}-${bpIdx}`} className="font-bold text-ink-strong">{bp.slice(2, -2)}</strong>;
                                    }
                                    return bp;
                                });
                            });

                            return <p key={pIdx} className="mb-2 last:mb-0 inline-block w-full">{renderedParagraph}</p>;
                        })}
                    </div>
                );
            })}
        </div>
    );
}
