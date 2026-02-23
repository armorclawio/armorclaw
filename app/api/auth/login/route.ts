
import { getCloudflareContext } from '@/lib/cloudflare';

export const runtime = 'edge';

export async function GET(request: Request) {
    const url = new URL(request.url);

    // 通过 Cloudflare context 获取环境变量（Secrets 必须通过此方式读取）
    const ctx = getCloudflareContext();
    const clientId = (ctx.env as any).GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID;

    if (!clientId) {
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

    response.headers.set(
        'Set-Cookie',
        `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
    );

    return response;
}
