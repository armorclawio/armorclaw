import { getCurrentUser } from '@/lib/auth';
import { getCloudflareContext } from '@/lib/cloudflare';
import { getOrCreateDbUser } from '@/lib/db';

export async function GET(request: Request) {
    const user = await getCurrentUser();
    if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') === 'json' ? 'json' : 'csv';

    try {
        const ctx = await getCloudflareContext();
        const db = ctx.env.DB as any;

        if (!db) {
            return Response.json({ error: 'Database not available' }, { status: 500 });
        }

        const dbUser = await getOrCreateDbUser(db, user);

        // Fetch all audits (no limit for export)
        const result = await db.prepare(`
            SELECT
                id,
                skill_name,
                status,
                score,
                is_public,
                created_at,
                updated_at
            FROM audits
            WHERE user_id = ?
            ORDER BY created_at DESC
        `).bind(dbUser.id).all();

        const audits: Record<string, any>[] = result.results || [];

        if (format === 'json') {
            const body = JSON.stringify({ exported_at: new Date().toISOString(), total: audits.length, audits }, null, 2);
            return new Response(body, {
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Disposition': `attachment; filename="armorclaw-audits-${today()}.json"`,
                },
            });
        }

        // CSV
        const headers = ['id', 'skill_name', 'status', 'score', 'is_public', 'created_at', 'updated_at'];
        const rows = [
            headers.join(','),
            ...audits.map(a =>
                headers.map(h => {
                    const val = a[h] ?? '';
                    // Escape commas and quotes
                    const str = String(val).replace(/"/g, '""');
                    return str.includes(',') || str.includes('"') || str.includes('\n')
                        ? `"${str}"`
                        : str;
                }).join(',')
            ),
        ];
        const csv = rows.join('\n');

        return new Response(csv, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="armorclaw-audits-${today()}.csv"`,
            },
        });

    } catch (error) {
        console.error('Export failed:', error);
        return Response.json({ error: 'Export failed' }, { status: 500 });
    }
}

function today(): string {
    return new Date().toISOString().split('T')[0];
}
