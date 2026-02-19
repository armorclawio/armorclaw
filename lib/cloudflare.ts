// 避免在每个文件中重复 @ts-ignore
export const getCloudflareContext = async () => {
    // @ts-ignore
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    return getRequestContext();
};
