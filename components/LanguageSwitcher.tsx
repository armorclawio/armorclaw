'use client';

import { useTranslation } from './LanguageProvider';
import { Languages } from 'lucide-react';

export function LanguageSwitcher() {
    const { language, setLanguage } = useTranslation();

    return (
        <button
            onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
            className="flex items-center gap-2 bg-surface text-ink-soft border border-line px-3 py-1.5 rounded-full font-medium text-xs transition-all hover:bg-line hover:text-ink"
            title={language === 'en' ? '切换为中文' : 'Switch to English'}
        >
            <Languages className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'EN' : '中文'}</span>
        </button>
    );
}
