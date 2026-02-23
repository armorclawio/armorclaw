/**
 * 在运行时动态获取 Cloudflare 绑定上下文。
 * 使用动态 import 避免静态导入 @opennextjs/cloudflare，
 * 防止 Next.js 将路由误标记为 edge runtime 导致构建失败。
 */
export async function getCloudflareContext() {
    try {
        const { getCloudflareContext: _get } = await import('@opennextjs/cloudflare');
        return _get();
    } catch (e) {
        console.warn('Cloudflare context not available, returning empty env');
        return { env: {} as any, cf: {} as any, ctx: {} as any };
    }
}
