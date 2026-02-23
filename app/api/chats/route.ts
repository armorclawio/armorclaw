import { getCurrentUser } from '@/lib/auth';
import { getCloudflareContext } from '@/lib/cloudflare';


export async function GET(request: Request) {
    const user = await getCurrentUser();

    if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const ctx = await getCloudflareContext();
        const db = ctx.env.DB as any;

        if (!db) {
            return Response.json({ error: 'Database not available' }, { status: 500 });
        }

        const dbUser = await db.prepare('SELECT id FROM users WHERE github_id = ?').bind(user.userId).first() as any;
        if (!dbUser) {
            return Response.json({ chats: [], count: 0 });
        }

        const result = await db.prepare(`
            SELECT id, title, created_at
            FROM chats
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 50
        `).bind(dbUser.id).all();

        return Response.json({
            chats: result.results || [],
            count: result.results?.length || 0
        });

    } catch (error) {
        console.error('Failed to fetch chats:', error);
        return Response.json({ error: 'Failed to fetch chats' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const user = await getCurrentUser();

    if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { title } = body;
        const chatId = crypto.randomUUID();

        const ctx = await getCloudflareContext();
        const db = ctx.env.DB as any;

        if (!db) {
            return Response.json({ error: 'Database not available' }, { status: 500 });
        }

        const dbUser = await db.prepare('SELECT id FROM users WHERE github_id = ?').bind(user.userId).first() as any;
        if (!dbUser) {
            return Response.json({ error: 'User not found in database' }, { status: 400 });
        }

        await db.prepare(`
            INSERT INTO chats (id, user_id, title)
            VALUES (?, ?, ?)
        `).bind(chatId, dbUser.id, title || 'New Chat').run();

        return Response.json({
            id: chatId,
            title: title || 'New Chat',
            created_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('Failed to create chat:', error);
        return Response.json({ error: 'Failed to create chat' }, { status: 500 });
    }
}
