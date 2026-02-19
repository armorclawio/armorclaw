import { getCurrentUser } from '@/lib/auth';
import { getCloudflareContext } from '@/lib/cloudflare';

export const runtime = 'edge';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUser();
    const { id: chatId } = await params;

    if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const ctx = await getCloudflareContext();
        const db = ctx.env.DB as any;

        if (!db) {
            return Response.json({ error: 'Database not available' }, { status: 500 });
        }

        // Verify ownership
        const chat = await db.prepare(`SELECT * FROM chats WHERE id = ? AND user_id = ?`).bind(chatId, user.userId).first();

        if (!chat) {
            return Response.json({ error: 'Chat not found' }, { status: 404 });
        }

        const messages = await db.prepare(`
            SELECT id, role, content, created_at
            FROM messages
            WHERE chat_id = ?
            ORDER BY created_at ASC
        `).bind(chatId).all();

        return Response.json({
            chat,
            messages: messages.results || []
        });

    } catch (error) {
        console.error('Failed to fetch chat messages:', error);
        return Response.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUser();
    const { id: chatId } = await params;

    if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const ctx = await getCloudflareContext();
        const db = ctx.env.DB as any;

        if (!db) {
            return Response.json({ error: 'Database not available' }, { status: 500 });
        }

        const result = await db.prepare(`
            DELETE FROM chats WHERE id = ? AND user_id = ?
        `).bind(chatId, user.userId).run();

        if (result.meta?.changes === 0) {
            return Response.json({ error: 'Chat not found or deletion failed' }, { status: 404 });
        }

        return Response.json({ success: true, id: chatId });

    } catch (error) {
        console.error('Failed to delete chat:', error);
        return Response.json({ error: 'Failed to delete chat' }, { status: 500 });
    }
}
