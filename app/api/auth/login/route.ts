import { getCloudflareContext } from '@/lib/cloudflare';

export const runtime = 'edge';

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const { env } = getCloudflareContext();

        // 优先从 Cloudflare env 获取，兜底 process.env
        const clientId = env.GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID;

        if (!clientId) {
            console.error('GITHUB_CLIENT_ID is not configured');
            return Response.redirect(`${url.origin}/error?message=oauth_not_configured`, 302);
        }

        // 生成 CSRF state token
        const state = crypto.randomUUID();

        // 构建 GitHub OAuth 授权 URL
        const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
        githubAuthUrl.searchParams.set('client_id', clientId);
        githubAuthUrl.searchParams.set('redirect_uri', `${url.origin}/api/auth/callback`);
        githubAuthUrl.searchParams.set('scope', 'read:user user:email');
        githubAuthUrl.searchParams.set('state', state);

        // 将 state 存储在 cookie 中用于验证
        const response = Response.redirect(githubAuthUrl.toString(), 302);

        const isProduction = (env.NODE_ENV || process.env.NODE_ENV) === 'production';
        response.headers.set(
            'Set-Cookie',
            `oauth_state=${state}; Path=/; HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=Lax; Max-Age=600`
        );

        return response;
    } catch (error) {
        console.error('Login route error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
