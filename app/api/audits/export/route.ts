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

        // Fetch all audits
        const result = await db.prepare(`
            SELECT
                id,
                skill_name,
                skill_hash,
                status,
                score,
                is_public,
                created_at,
                ebpf_log_json
            FROM audits
            WHERE user_id = ?
            ORDER BY created_at DESC
        `).bind(dbUser.id).all();

        const audits: Record<string, any>[] = result.results || [];

        if (format === 'json') {
            // Parse ebpf_log_json for better JSON structure
            const richAudits = audits.map(a => {
                const { ebpf_log_json, ...rest } = a;
                return {
                    ...rest,
                    is_public: !!a.is_public,
                    ebpf_log: ebpf_log_json ? tryParse(ebpf_log_json) : null
                };
            });

            const body = JSON.stringify({
                exported_at: new Date().toISOString(),
                total: audits.length,
                audits: richAudits
            }, null, 2);

            return new Response(body, {
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Disposition': `attachment; filename="armorclaw-audits-${today()}.json"`,
                },
            });
        }

        // CSV
        // Mapping internal keys to human-friendly headers
        const headerMap = {
            'id': 'Audit ID',
            'skill_name': 'Skill Name',
            'skill_hash': 'File Hash',
            'status': 'Status',
            'score': 'Security Score',
            'is_public': 'Is Public',
            'created_at': 'Timestamp'
        };
        const keys = Object.keys(headerMap) as (keyof typeof headerMap)[];
        const headers = Object.values(headerMap);

        const rows = [
            headers.join(','),
            ...audits.map(a =>
                keys.map(k => {
                    let val = a[k] ?? '';
                    if (k === 'is_public') val = !!val ? 'Yes' : 'No';

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

function tryParse(json: string) {
    try {
        return JSON.parse(json);
    } catch {
        return json;
    }
}
