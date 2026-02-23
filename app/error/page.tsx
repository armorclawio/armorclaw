import { AlertCircle, Home, RefreshCw } from "lucide-react";

const errorMessages: Record<string, { title: string; description: string; action?: string }> = {
    no_code: {
        title: '授权失败',
        description: '未收到 GitHub 授权码。请重试登录流程。',
        action: '重新登录'
    },
    invalid_state: {
        title: '安全验证失败',
        description: '检测到可能的 CSRF 攻击。请重新开始登录流程。',
        action: '重新登录'
    },
    oauth_not_configured: {
        title: '配置错误',
        description: 'GitHub OAuth 未正确配置。请联系管理员。',
    },
    auth_failed: {
        title: '认证失败',
        description: '无法完成 GitHub 认证。请稍后重试。',
        action: '重试'
    },
    'Failed to get access token': {
        title: 'Token 获取失败',
        description: 'GitHub 拒绝了访问令牌请求。请重新授权。',
        action: '重新登录'
    },
};

export default async function ErrorPage({
    searchParams,
}: {
    searchParams: Promise<{ message?: string }>;
}) {
    const params = await searchParams;
    const errorKey = params.message || 'auth_failed';
    const error = errorMessages[errorKey] || {
        title: '未知错误',
        description: errorKey,
        action: '返回首页'
    };

    return (
        <div className="h-full w-full flex flex-col items-center justify-center p-8 relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[128px]" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-[128px]" />

            <div className="max-w-md w-full space-y-8 text-center z-10">
                {/* Error Icon */}
                <div className="flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
                        <div className="relative bg-red-500/10 p-6 rounded-full border border-red-500/20">
                            <AlertCircle className="w-16 h-16 text-red-400" />
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                <div className="space-y-3">
                    <h1 className="text-3xl font-black tracking-tight text-ink">
                        {error.title}
                    </h1>
                    <p className="text-lg text-ink-soft">
                        {error.description}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                    {error.action && (
                        <a
                            href="/api/auth/login"
                            className="flex items-center justify-center gap-2 bg-ink text-surface px-6 py-3 rounded-full font-medium text-sm transition-all hover:opacity-90"
                        >
                            <RefreshCw className="w-4 h-4" />
                            {error.action}
                        </a>
                    )}
                    <a
                        href="/"
                        className="flex items-center justify-center gap-2 bg-surface hover:bg-line text-ink px-6 py-3 rounded-full font-medium text-sm transition-all border border-line"
                    >
                        <Home className="w-4 h-4" />
                        返回首页
                    </a>
                </div>

                {/* Debug Info (only in development) */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="mt-8 p-4 bg-surface rounded-xl border border-line">
                        <p className="text-xs text-ink-soft/40 font-mono">
                            Error Code: {errorKey}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
