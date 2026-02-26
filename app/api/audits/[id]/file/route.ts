import { getCurrentUser } from '@/lib/auth';
import { getCloudflareContext } from '@/lib/cloudflare';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: auditId } = await params;
        const user = await getCurrentUser();
        const clientIP = request.headers.get('cf-connecting-ip') || 'anonymous';

        const ctx = await getCloudflareContext();
        const db = ctx.env.DB as any;
        const storage = ctx.env.STORAGE as any;

        if (!db || !storage) {
            return Response.json({ error: 'Backend services not available' }, { status: 500 });
        }

        // 获取审计记录
        const audit = await db.prepare(`
            SELECT a.*, u.github_id
            FROM audits a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE a.id = ?
        `).bind(auditId).first() as any;

        if (!audit) {
            return Response.json({ error: 'Audit record not found' }, { status: 404 });
        }

        // 验证下载权限 (只有所有者或公开报告可以下载)
        let isOwner = false;
        if (user) {
            isOwner = audit.github_id === user.userId;
        } else {
            const expectedUserId = `ip:${clientIP}`;
            isOwner = audit.user_id === expectedUserId;
        }

        if (!isOwner && !audit.is_public) {
            return Response.json({ error: 'Unauthorized to download this file' }, { status: 403 });
        }

        // 从存储中获取文件
        const fileObject = await storage.get(audit.skill_hash);
        if (!fileObject) {
            return Response.json({ error: 'File content missing from storage' }, { status: 404 });
        }

        const headers = new Headers();
        fileObject.writeHttpMetadata(headers);
        headers.set('etag', fileObject.httpEtag);
        headers.set('Content-Disposition', `attachment; filename="${audit.skill_name}"`);

        // 尝试设置内容类型（如果是 zip）
        if (audit.skill_name.endsWith('.zip')) {
            headers.set('Content-Type', 'application/zip');
        } else if (audit.skill_name.endsWith('.c') || audit.skill_name.endsWith('.ebpf')) {
            headers.set('Content-Type', 'text/plain');
        }

        return new Response(fileObject.body, {
            headers,
        });

    } catch (error) {
        console.error('Download error:', error);
        return Response.json({ error: 'Failed to process download request' }, { status: 500 });
    }
}
