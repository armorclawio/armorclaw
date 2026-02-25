import { getCurrentUser } from '@/lib/auth';
import { getCloudflareContext } from '@/lib/cloudflare';
import { getOrCreateDbUser } from '@/lib/db';

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { id } = await params;

    // 获取当前用户
    const user = await getCurrentUser();

    if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 获取 D1 数据库
        const ctx = await getCloudflareContext();
        const db = ctx.env.DB as any;

        if (!db) {
            return Response.json({ error: 'Database not available' }, { status: 500 });
        }

        const dbUser = await getOrCreateDbUser(db, user);

        // 删除审计记录，确保只能删除属于自己的记录
        const result = await db.prepare(`
            DELETE FROM audits 
            WHERE id = ? AND user_id = ?
        `).bind(id, dbUser.id).run();

        if (result.success) {
            return Response.json({ success: true });
        } else {
            return Response.json({ error: 'Failed to delete audit' }, { status: 500 });
        }

    } catch (error) {
        console.error('Failed to delete audit:', error);
        return Response.json({ error: 'Failed to delete audit' }, { status: 500 });
    }
}
