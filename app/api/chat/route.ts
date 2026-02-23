import { chatWithAI } from '@/lib/ai-service';
import { getCurrentUser } from '@/lib/auth';
import { getCloudflareContext } from '@/lib/cloudflare';

export async function POST(request: Request) {
    try {
        // 获取请求数据
        const body = await request.json();
        const { message, conversationHistory, chatId: existingChatId } = body;

        let chatId = existingChatId;
        const user = await getCurrentUser();

        if (!message || typeof message !== 'string') {
            return Response.json({ error: 'Message is required' }, { status: 400 });
        }

        // 获取 AI API Key
        let aiApiKey: string | undefined;

        try {
            // 尝试从 Cloudflare 环境获取（生产环境）
            const ctx = await getCloudflareContext();
            aiApiKey = ctx.env.GLM_API_KEY;
            console.log('Using Cloudflare env API key');
        } catch (e) {
            // 开发环境回退到 process.env
            console.log('Cloudflare context not available, using process.env');
        }

        // 如果 Cloudflare 环境中没有，尝试 process.env
        if (!aiApiKey) {
            aiApiKey = process.env.GLM_API_KEY;
            console.log('API key from process.env:', aiApiKey ? 'Found' : 'Not found');
        }

        if (!aiApiKey) {
            console.error('GLM_API_KEY not configured in environment');
            return Response.json(
                { error: 'AI service not configured. Please set GLM_API_KEY environment variable.' },
                { status: 503 }
            );
        }

        // 系统提示词 - 定义 AI 的角色和行为
        const systemPrompt = `你是 ArmorClaw 的 AI 助手，专门帮助用户理解和审计 eBPF (Extended Berkeley Packet Filter) 程序。

你的职责包括：
1. 回答关于 eBPF 技术的问题
2. 解释 eBPF 程序的安全最佳实践
3. 帮助用户理解内核钩子和传感器
4. 提供代码审计建议
5. 解答关于 ArmorClaw 平台使用的问题

请用友好、专业的语气回答用户的问题。如果用户询问的内容超出你的专业范围，请礼貌地说明。`;

        // 调用 AI 服务
        const aiResponse = await chatWithAI(
            message,
            aiApiKey,
            conversationHistory,
            systemPrompt
        );

        // 如果用户已登录，保存聊天记录
        if (user) {
            try {
                const ctx = await getCloudflareContext();
                const db = ctx.env.DB as any;

                if (db) {
                    // 如果没有 chatId，创建一个新的聊天
                    if (!chatId) {
                        chatId = crypto.randomUUID();
                        // 提取标题（使用消息的前 30 个字符）
                        const title = message.slice(0, 30) + (message.length > 30 ? '...' : '');

                        const dbUser = await db.prepare('SELECT id FROM users WHERE github_id = ?').bind(user.userId).first() as any;
                        if (!dbUser) {
                            throw new Error('User not found in database');
                        }

                        await db.prepare(`
                            INSERT INTO chats (id, user_id, title)
                            VALUES (?, ?, ?)
                        `).bind(chatId, dbUser.id, title).run();
                    }

                    // 保存用户消息
                    await db.prepare(`
                        INSERT INTO messages (id, chat_id, role, content)
                        VALUES (?, ?, ?, ?)
                    `).bind(crypto.randomUUID(), chatId, 'user', message).run();

                    // 保存 AI 消息
                    await db.prepare(`
                        INSERT INTO messages (id, chat_id, role, content)
                        VALUES (?, ?, ?, ?)
                    `).bind(crypto.randomUUID(), chatId, 'assistant', aiResponse).run();
                }
            } catch (dbError) {
                console.error('Failed to save chat history:', dbError);
                // 不阻塞响应，只记录错误
            }
        }

        return Response.json({
            success: true,
            message: aiResponse,
            chatId: chatId, // 返回 chatId，以便前端更新 URL 或状态
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Chat error:', error);
        return Response.json(
            {
                error: 'Failed to process chat message',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}
