import { getRequestContext } from '@opennextjs/cloudflare';

// 统一封装 Cloudflare 绑定获取方式
export const getCloudflareContext = () => {
    return getRequestContext();
};
