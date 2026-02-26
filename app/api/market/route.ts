import { getCloudflareContext } from '@/lib/cloudflare';

export const runtime = 'edge';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    try {
        const ctx = await getCloudflareContext();
        const db = ctx.env.DB as any;

        if (!db) {
            return Response.json({ error: 'Database not available' }, { status: 500 });
        }

        // Query public audits
        let sql = `
          SELECT 
            id,
            skill_name,
            status,
            score,
            created_at
          FROM audits
          WHERE is_public = 1
        `;

        const params: any[] = [];
        if (query) {
            sql += ` AND skill_name LIKE ?`;
            params.push(`%${query}%`);
        }

        sql += ` ORDER BY created_at DESC LIMIT 100`;

        const result = await db.prepare(sql).bind(...params).all();

        return Response.json({
            skills: result.results || [],
            count: result.results?.length || 0
        });

    } catch (error) {
        console.error('Failed to fetch public skills:', error);
        return Response.json({ error: 'Failed to fetch public skills' }, { status: 500 });
    }
}
