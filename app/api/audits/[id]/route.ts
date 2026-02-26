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

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const user = await getCurrentUser();
    const clientIP = request.headers.get('cf-connecting-ip') || 'anonymous';

    try {
        const { isPublic } = await request.json();
        const ctx = await getCloudflareContext();
        const db = ctx.env.DB as any;

        if (!db) {
            return Response.json({ error: 'Database not available' }, { status: 500 });
        }

        let dbUserId: string;
        if (user) {
            const dbUser = await getOrCreateDbUser(db, user);
            dbUserId = dbUser.id;
        } else {
            dbUserId = `ip:${clientIP}`;
        }

        // 更新公开状态，确保只能更新属于自己的记录
        const result = await db.prepare(`
            UPDATE audits 
            SET is_public = ?
            WHERE id = ? AND user_id = ?
        `).bind(isPublic ? 1 : 0, id, dbUserId).run();

        if (result.success && result.meta.changes > 0) {
            return Response.json({ success: true });
        } else if (result.success && result.meta.changes === 0) {
            return Response.json({ error: 'Audit not found or not owner' }, { status: 403 });
        } else {
            return Response.json({ error: 'Failed to update audit' }, { status: 500 });
        }

    } catch (error) {
        console.error('Failed to update audit:', error);
        return Response.json({ error: 'Failed to update audit' }, { status: 500 });
    }
}
