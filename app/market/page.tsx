'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ShoppingBag, Loader2, Star, Shield, ExternalLink, Calendar } from 'lucide-react';
import { useTranslation } from '@/components/LanguageProvider';

interface Skill {
    id: string;
    skill_name: string;
    status: string;
    score: number | null;
    created_at: string;
    summary?: string;
}

export default function SkillMarket() {
    const { t, language } = useTranslation();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [skills, setSkills] = useState<Skill[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchSkills();
    }, []);

    const fetchSkills = async (query = '') => {
        setLoading(true);
        try {
            const response = await fetch(`/api/market?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Failed to fetch skills');
            const data = await response.json();
            setSkills(data.skills || []);
        } catch (err) {
            console.error(err);
            setError(t.market.loadError);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchSkills(searchQuery);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US');
    };

    return (
        <div className="h-full flex flex-col p-6 overflow-hidden">
            {/* Header with Search */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 mt-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-accent/10 rounded-2xl">
                        <ShoppingBag className="w-8 h-8 text-accent" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-ink">{t.market.title}</h1>
                        <p className="text-ink-soft text-sm">{t.market.publicSkills}</p>
                    </div>
                </div>

                <form onSubmit={handleSearch} className="relative w-full md:w-96 group">
                    <input
                        type="text"
                        placeholder={t.market.searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-surface border border-line rounded-2xl py-3 pl-12 pr-4 text-ink placeholder:text-ink-soft/40 focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all group-hover:border-accent/30"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-soft/40 group-focus-within:text-accent transition-colors" />
                </form>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
                        <p className="text-ink-soft animate-pulse">Loading market...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <p className="text-error font-medium">{error}</p>
                        <button
                            onClick={() => fetchSkills()}
                            className="mt-4 text-accent hover:underline text-sm font-medium"
                        >
                            Try Again
                        </button>
                    </div>
                ) : skills.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <ShoppingBag className="w-16 h-16 text-ink-soft/20 mb-4" />
                        <p className="text-ink-soft font-medium text-lg">{t.market.noSkills}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                        {skills.map((skill) => (
                            <div
                                key={skill.id}
                                className="group bg-surface/50 border border-line rounded-3xl p-6 hover:border-accent/50 hover:bg-surface transition-all duration-300 flex flex-col shadow-sm hover:shadow-xl hover:shadow-accent/5"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-2 bg-accent/5 rounded-xl text-accent">
                                        <Shield className="w-5 h-5" />
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-bold">
                                        <Star className="w-3.5 h-3.5 fill-current" />
                                        {skill.score || 'N/A'}
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-ink mb-2 group-hover:text-accent transition-colors line-clamp-1">
                                    {skill.skill_name}
                                </h3>

                                <p className="text-ink-soft text-sm mb-6 line-clamp-2 flex-1">
                                    {skill.summary || 'A security audit report generated by ArmorClaw AI for critical infrastructure protection.'}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-line/50">
                                    <div className="flex items-center gap-2 text-xs text-ink-soft/60">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {formatDate(skill.created_at)}
                                    </div>

                                    <button
                                        onClick={() => router.push(`/audits/${skill.id}`)}
                                        className="flex items-center gap-1.5 text-xs font-bold text-accent hover:text-accent-hover transition-colors pr-1"
                                    >
                                        {t.market.viewDetails}
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
