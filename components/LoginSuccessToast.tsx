'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';

export function LoginSuccessToast() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // 检查 URL 参数
        const params = new URLSearchParams(window.location.search);
        if (params.get('login') === 'success') {
            setShow(true);

            // 3秒后自动关闭
            const timer = setTimeout(() => {
                setShow(false);
            }, 3000);

            // 清除 URL 参数
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);

            return () => clearTimeout(timer);
        }
    }, []);

    if (!show) return null;

    return (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
            <div className="bg-success/10 border border-success/20 rounded-xl p-4 backdrop-blur-xl shadow-2xl flex items-center gap-3 min-w-[300px]">
                <div className="flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-success" />
                </div>
                <div className="flex-1">
                    <p className="font-semibold text-ink text-sm">登录成功！</p>
                    <p className="text-ink-soft text-xs mt-0.5">欢迎回来</p>
                </div>
                <button
                    onClick={() => setShow(false)}
                    className="flex-shrink-0 text-ink-soft hover:text-ink transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
