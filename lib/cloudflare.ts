import { getCloudflareContext as _getCloudflareContext } from '@opennextjs/cloudflare';

/**
 * 统一获取 Cloudflare 绑定上下文
 */
export const getCloudflareContext = () => {
    try {
        // 使用官方推荐方法（@opennextjs/cloudflare v1.x）
        return _getCloudflareContext();
    } catch (e) {
        // 如果环境尚未初始化，返回空环境（防止构建崩溃）
        console.warn('Cloudflare context not found, returning empty env');
        return { env: {} as any, cf: {} as any, ctx: {} as any };
    }
};
