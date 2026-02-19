'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="flex items-center gap-1 rounded-full border border-line bg-surface p-1 w-[108px] h-[42px] opacity-20">
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1 rounded-full border border-line bg-surface p-1 shadow-sm transition-all duration-300">
            <button
                type="button"
                onClick={() => setTheme('system')}
                aria-label="System theme"
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${theme === 'system'
                        ? 'bg-accent text-white shadow-md transform scale-110'
                        : 'text-ink-soft hover:text-ink hover:bg-white/5'
                    }`}
            >
                <Monitor className="h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={() => setTheme('light')}
                aria-label="Light theme"
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${theme === 'light'
                        ? 'bg-accent text-white shadow-md transform scale-110'
                        : 'text-ink-soft hover:text-ink hover:bg-white/5'
                    }`}
            >
                <Sun className="h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={() => setTheme('dark')}
                aria-label="Dark theme"
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${theme === 'dark'
                        ? 'bg-accent text-white shadow-md transform scale-110'
                        : 'text-ink-soft hover:text-ink hover:bg-white/5'
                    }`}
            >
                <Moon className="h-4 w-4" />
            </button>
        </div>
    );
}
