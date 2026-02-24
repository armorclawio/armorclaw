import { SessionUser } from '@/types';

/**
 * 根据 github_id 查找数据库用户，如果不存在则自动创建。
 * 这样即便 OAuth 回调时写库失败，后续 API 调用也能自我修复。
 */
export async function getOrCreateDbUser(
    db: any,
    user: SessionUser
): Promise<{ id: string }> {
    // 先尝试查找已有用户
    const existing = await db.prepare(
        'SELECT id FROM users WHERE github_id = ?'
    ).bind(user.userId).first() as { id: string } | null;

    if (existing) {
        return existing;
    }

    // 用户不存在，自动创建（自愈机制）
    const newId = crypto.randomUUID();
    console.log(`Auto-creating DB user for github_id=${user.userId}, name=${user.name}`);

    await db.prepare(`
        INSERT INTO users (id, github_id, email, name, image, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(
        newId,
        user.userId,
        user.email || null,
        user.name || null,
        user.image || null
    ).run();

    return { id: newId };
}
