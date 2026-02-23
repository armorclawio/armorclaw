import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

import { SessionUser } from '@/types';

/**
 * 获取当前登录用户信息
 * 在 Server Component 或 API Route 中使用
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (process.env.ENABLE_DEV_AUTH_BYPASS === 'true' && !sessionCookie) {
        return {
            userId: 'dev-user-id',
            name: 'Dev User',
            email: 'dev@example.com',
            image: 'https://github.com/ghost.png',
        };
    }

    if (!sessionCookie) {
        return null;
    }

    try {
        // 尝试从 process.env 获取 SECRET（兼容 @opennextjs/cloudflare 和本地开发）
        const secretStr = process.env.SESSION_SECRET;

        // 不再因为 SECRET 未配置就抛出异常，而是使用默认值
        // （真实的 SECRET 应该在 Cloudflare Dashboard 中配置为 Secret）
        const secret = new TextEncoder().encode(
            secretStr || 'default-secret-change-me'
        );

        const { payload } = await jwtVerify(sessionCookie.value, secret);

        return {
            userId: payload.userId as string,
            name: payload.name as string | null,
            email: payload.email as string | null,
            image: payload.image as string,
        };
    } catch (error) {
        console.error('Failed to verify session:', error);
        if (process.env.ENABLE_DEV_AUTH_BYPASS === 'true') {
            return {
                userId: 'dev-user-id',
                name: 'Dev User',
                email: 'dev@example.com',
                image: 'https://github.com/ghost.png',
            };
        }
        return null;
    }
}
