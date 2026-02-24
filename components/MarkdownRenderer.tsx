
import React from 'react';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

/** 处理行内格式：`code`、**bold**、*italic*、~~strikethrough~~ */
function renderInline(text: string): React.ReactNode[] {
    // 按照优先级：行内代码 > 粗体 > 斜体 > 删除线
    const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~)/g);
    return tokens.map((token, i) => {
        if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
            return (
                <code
                    key={i}
                    className="bg-black/5 dark:bg-white/5 text-accent px-1.5 py-0.5 rounded text-[0.85em] font-mono border border-black/5 dark:border-white/5"
                >
                    {token.slice(1, -1)}
                </code>
            );
        }
        if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
            return <strong key={i} className="font-semibold">{token.slice(2, -2)}</strong>;
        }
        if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
            return <em key={i}>{token.slice(1, -1)}</em>;
        }
        if (token.startsWith('~~') && token.endsWith('~~') && token.length > 4) {
            return <del key={i}>{token.slice(2, -2)}</del>;
        }
        return token || null;
    });
}

/** 将 markdown 字符串解析为渲染节点列表 */
function parseMarkdown(content: string): React.ReactNode[] {
    const nodes: React.ReactNode[] = [];
    // 按行切割，保留空行
    const lines = content.split('\n');

    let i = 0;
    while (i < lines.length) {
        const line = lines[i];

        // ── 围栏代码块 ───────────────────────────────────────
        const fenceMatch = line.match(/^```(\w*)\s*$/);
        if (fenceMatch) {
            const lang = fenceMatch[1] || '';
            const codeLines: string[] = [];
            i++;
            while (i < lines.length && !lines[i].startsWith('```')) {
                codeLines.push(lines[i]);
                i++;
            }
            i++; // skip closing ```
            nodes.push(
                <pre
                    key={nodes.length}
                    className="bg-black/[0.03] dark:bg-white/[0.03] backdrop-blur-[2px] text-[0.82rem] md:text-sm p-4 rounded-xl overflow-x-auto my-3 border border-black/5 dark:border-white/10 font-mono leading-relaxed"
                >
                    {lang && (
                        <div className="text-ink-soft text-[10px] uppercase tracking-widest mb-2 pb-2 border-b border-white/10 select-none">
                            {lang}
                        </div>
                    )}
                    <code>{codeLines.join('\n')}</code>
                </pre>
            );
            continue;
        }

        // ── 标题 ─────────────────────────────────────────────
        const h1 = line.match(/^# (.+)$/);
        if (h1) {
            nodes.push(
                <h1 key={nodes.length} className="text-2xl font-bold mt-4 mb-2 leading-tight">
                    {renderInline(h1[1])}
                </h1>
            );
            i++; continue;
        }
        const h2 = line.match(/^## (.+)$/);
        if (h2) {
            nodes.push(
                <h2 key={nodes.length} className="text-xl font-bold mt-4 mb-2 leading-tight">
                    {renderInline(h2[1])}
                </h2>
            );
            i++; continue;
        }
        const h3 = line.match(/^### (.+)$/);
        if (h3) {
            nodes.push(
                <h3 key={nodes.length} className="text-lg font-semibold mt-3 mb-1 leading-tight">
                    {renderInline(h3[1])}
                </h3>
            );
            i++; continue;
        }
        const h4 = line.match(/^#### (.+)$/);
        if (h4) {
            nodes.push(
                <h4 key={nodes.length} className="text-base font-semibold mt-2 mb-1">
                    {renderInline(h4[1])}
                </h4>
            );
            i++; continue;
        }

        // ── 水平线 ───────────────────────────────────────────
        if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
            nodes.push(<hr key={nodes.length} className="border-t border-current opacity-20 my-3" />);
            i++; continue;
        }

        // ── 无序列表：收集连续的 -/*/+ 开头行 ────────────────
        if (/^[\-\*\+] /.test(line)) {
            const items: React.ReactNode[] = [];
            while (i < lines.length && /^[\-\*\+] /.test(lines[i])) {
                const text = lines[i].replace(/^[\-\*\+] /, '');
                items.push(
                    <li key={items.length} className="pl-1">
                        {renderInline(text)}
                    </li>
                );
                i++;
            }
            nodes.push(
                <ul key={nodes.length} className="list-disc list-outside pl-5 my-2 space-y-1">
                    {items}
                </ul>
            );
            continue;
        }

        // ── 有序列表：收集连续的 1. 2. 开头行 ────────────────
        if (/^\d+\. /.test(line)) {
            const items: React.ReactNode[] = [];
            while (i < lines.length && /^\d+\. /.test(lines[i])) {
                const text = lines[i].replace(/^\d+\. /, '');
                items.push(
                    <li key={items.length} className="pl-1">
                        {renderInline(text)}
                    </li>
                );
                i++;
            }
            nodes.push(
                <ol key={nodes.length} className="list-decimal list-outside pl-5 my-2 space-y-1">
                    {items}
                </ol>
            );
            continue;
        }

        // ── 引用块 ───────────────────────────────────────────
        if (line.startsWith('> ')) {
            const quoteLines: string[] = [];
            while (i < lines.length && lines[i].startsWith('> ')) {
                quoteLines.push(lines[i].slice(2));
                i++;
            }
            nodes.push(
                <blockquote
                    key={nodes.length}
                    className="border-l-4 border-accent/50 pl-4 my-2 opacity-80 italic"
                >
                    {quoteLines.map((ql, qi) => (
                        <p key={qi}>{renderInline(ql)}</p>
                    ))}
                </blockquote>
            );
            continue;
        }

        // ── 空行：插入段落间距 ────────────────────────────────
        if (line.trim() === '') {
            // 避免在节点列表末尾/开头插入多余空行
            if (nodes.length > 0) {
                nodes.push(<div key={nodes.length} className="h-2" />);
            }
            i++; continue;
        }

        // ── 普通段落 ─────────────────────────────────────────
        nodes.push(
            <p key={nodes.length} className="leading-relaxed">
                {renderInline(line)}
            </p>
        );
        i++;
    }

    return nodes;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
    if (!content) return null;

    return (
        <div className={`markdown-content text-left w-full ${className}`}>
            {parseMarkdown(content)}
        </div>
    );
}
