import { getCurrentUser } from '@/lib/auth';
import { getCloudflareContext } from '@/lib/cloudflare';
import { getOrCreateDbUser } from '@/lib/db';

export async function GET(request: Request) {
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

        // 查询用户的审计历史
        const result = await db.prepare(`
          SELECT 
            id,
            skill_name,
            status,
            score,
            created_at
          FROM audits
          WHERE user_id = ?
          ORDER BY created_at DESC
          LIMIT 50
        `).bind(dbUser.id).all();

        return Response.json({
            audits: result.results || [],
            count: result.results?.length || 0
        });

    } catch (error) {
        console.error('Failed to fetch audits:', error);
        return Response.json({ error: 'Failed to fetch audits' }, { status: 500 });
    }
}
