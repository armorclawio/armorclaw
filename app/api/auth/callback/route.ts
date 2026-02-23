
interface GitHubUser {
    id: number;
    login: string;
    email: string | null;
    name: string | null;
    avatar_url: string;
}

interface GitHubEmail {
    email: string;
    primary: boolean;
    verified: boolean;
}

export async function GET(request: Request) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code) {
        return Response.redirect(`${url.origin}/error?message=no_code`, 302);
    }

    // 验证 CSRF state token
    const cookieHeader = request.headers.get('cookie');
    const cookies: Record<string, string> = {};
    if (cookieHeader) {
        cookieHeader.split('; ').forEach(c => {
            const parts = c.split('=');
            if (parts.length >= 2) {
                const key = parts[0];
                const val = parts.slice(1).join('=');
                try {
                    cookies[key] = decodeURIComponent(val);
                } catch (e) {
                    console.warn(`Failed to decode cookie ${key}`);
                }
            }
        });
    }
    const storedState = cookies['oauth_state'];

    if (!state || !storedState || state !== storedState) {
        return Response.redirect(`${url.origin}/error?message=invalid_state`, 302);
    }

    // 在 @opennextjs/cloudflare 环境中，process.env 可读取所有 vars 和 secrets
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const sessionSecret = process.env.SESSION_SECRET;

    if (!clientId || !clientSecret) {
        return Response.redirect(`${url.origin}/error?message=oauth_not_configured`, 302);
    }

    try {
        // 1. 用 code 换取 access_token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code,
            }),
        });

        const tokenData = await tokenResponse.json() as { access_token?: string; error?: string };

        if (!tokenData.access_token) {
            throw new Error(tokenData.error || 'Failed to get access token');
        }

        const accessToken = tokenData.access_token;

        // 2. 获取用户信息
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            },
        });

        const userData = await userResponse.json() as GitHubUser;

        // 3. 如果 email 为空，尝试获取主邮箱
        let email = userData.email;
        if (!email) {
            const emailResponse = await fetch('https://api.github.com/user/emails', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                },
            });
            const emails = await emailResponse.json() as GitHubEmail[];
            const primaryEmail = emails.find(e => e.primary && e.verified);
            email = primaryEmail?.email || null;
        }

        // 4. 存入 D1 数据库（通过 getCloudflareContext，仅在运行时调用，不在模块顶层导入）
        try {
            const { getCloudflareContext } = await import('@opennextjs/cloudflare');
            const ctx = getCloudflareContext();
            const db = (ctx.env as any).DB;

            if (db) {
                const userId = crypto.randomUUID();

                const existingUser = await db.prepare(
                    'SELECT id FROM users WHERE github_id = ?'
                ).bind(userData.id.toString()).first();

                if (existingUser) {
                    await db.prepare(`
                        UPDATE users 
                        SET email = ?, name = ?, image = ?
                        WHERE github_id = ?
                    `).bind(
                        email,
                        userData.name,
                        userData.avatar_url,
                        userData.id.toString()
                    ).run();
                } else {
                    await db.prepare(`
                        INSERT INTO users (id, github_id, email, name, image, created_at)
                        VALUES (?, ?, ?, ?, ?, datetime('now'))
                    `).bind(
                        userId,
                        userData.id.toString(),
                        email,
                        userData.name,
                        userData.avatar_url
                    ).run();
                }
            }
        } catch (dbError) {
            console.error('Database error:', dbError);
            // 即使数据库失败，也继续登录流程
        }

        // 5. 创建 Session（使用 JWT Cookie）
        const sessionData = {
            userId: userData.id.toString(),
            name: userData.name,
            email,
            image: userData.avatar_url,
        };

        const { SignJWT } = await import('jose');
        const secret = new TextEncoder().encode(sessionSecret || 'default-secret-change-me');

        const token = await new SignJWT(sessionData)
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('7d')
            .sign(secret);

        // 6. 设置 Cookie 并重定向
        const response = Response.redirect(`${url.origin}?login=success`, 302);

        const sessionCookie = `session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`;
        const clearStateCookie = 'oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';

        response.headers.append('Set-Cookie', sessionCookie);
        response.headers.append('Set-Cookie', clearStateCookie);

        return response;

    } catch (error) {
        console.error('OAuth callback error:', error);
        const errorMessage = error instanceof Error ? error.message : 'auth_failed';
        return Response.redirect(`${url.origin}/error?message=${encodeURIComponent(errorMessage)}`, 302);
    }
}
