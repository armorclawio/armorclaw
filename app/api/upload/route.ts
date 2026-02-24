import { getCurrentUser } from '@/lib/auth';
import { getCloudflareContext } from '@/lib/cloudflare';
import { getOrCreateDbUser } from '@/lib/db';


// 允许的文件类型
const ALLOWED_TYPES = [
    'application/zip',
    'application/x-tar',
    'application/gzip',
    'application/x-gzip',
    'text/plain',
    'application/octet-stream',
    // eBPF 相关文件
    'application/x-object',
    'application/x-executable',
];

// 最大文件大小：10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request) {
    try {
        // 验证用户登录
        const user = await getCurrentUser();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 获取表单数据
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return Response.json({ error: 'No file provided' }, { status: 400 });
        }

        // 验证文件大小
        if (file.size > MAX_FILE_SIZE) {
            return Response.json(
                { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
                { status: 400 }
            );
        }

        // 验证文件类型
        // 验证文件类型
        const isValidType = ALLOWED_TYPES.includes(file.type);
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
        // 允许的扩展名白名单（作为辅助验证）
        const ALLOWED_EXTENSIONS = ['c', 'h', 'o', 'zip', 'tar', 'gz', 'json', 'yaml', 'md', 'txt'];
        const isValidExtension = ALLOWED_EXTENSIONS.includes(fileExtension);

        if (!isValidType || (file.type === '' && !isValidExtension)) {
            // 如果类型为空（某些系统可能不发送 type），则必须验证扩展名
            // 如果类型不为空但不在白名单中，拒绝
            if (file.type !== '' && !isValidType) {
                return Response.json(
                    { error: 'Invalid file type. Please upload a valid eBPF skill file.' },
                    { status: 400 }
                );
            }
            // 如果类型是空，检查扩展名
            if (file.type === '' && !isValidExtension) {
                return Response.json(
                    { error: 'Unknown file type and invalid extension.' },
                    { status: 400 }
                );
            }
        }

        // 生成唯一的文件名
        const timestamp = Date.now();
        const randomId = crypto.randomUUID();
        // fileExtension 已经在前面定义并验证过了
        // const fileExtension = file.name.split('.').pop() || 'bin';
        const finalExtension = fileExtension || 'bin';
        const fileName = `${user.userId}/${timestamp}-${randomId}.${finalExtension}`;

        // 获取 R2 存储桶
        const ctx = await getCloudflareContext();
        const storage = ctx.env.STORAGE;

        if (!storage) {
            return Response.json({ error: 'Storage not available' }, { status: 500 });
        }

        // 读取文件内容
        const fileBuffer = await file.arrayBuffer();

        // 上传到 R2
        await storage.put(fileName, fileBuffer, {
            httpMetadata: {
                contentType: file.type || 'application/octet-stream',
            },
            customMetadata: {
                originalName: file.name,
                uploadedBy: user.userId,
                uploadedAt: new Date().toISOString(),
            },
        });

        // 保存文件记录到数据库
        const db = ctx.env.DB;
        if (db) {
            try {
                // 查找或创建用户
                const dbUser = await getOrCreateDbUser(db, user);

                await db.prepare(`
                    INSERT INTO audits (id, user_id, skill_name, skill_hash, status, created_at)
                    VALUES (?, ?, ?, ?, ?, datetime('now'))
                `).bind(
                    randomId,
                    dbUser.id,
                    file.name,
                    fileName, // 使用 R2 key 作为 hash
                    'pending'
                ).run();
            } catch (dbError) {
                console.error('Failed to save to database:', dbError);
                // 继续，即使数据库保存失败
            }
        }

        return Response.json({
            success: true,
            file: {
                id: randomId,
                name: file.name,
                size: file.size,
                type: file.type,
                key: fileName,
                uploadedAt: new Date().toISOString(),
            },
        });

    } catch (error) {
        console.error('Upload error:', error);
        return Response.json(
            { error: 'Failed to upload file' },
            { status: 500 }
        );
    }
}

// 获取文件列表
export async function GET(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const ctx = await getCloudflareContext();
        const storage = ctx.env.STORAGE;

        if (!storage) {
            return Response.json({ error: 'Storage not available' }, { status: 500 });
        }

        // 列出用户的文件
        const prefix = `${user.userId}/`;
        const listed = await storage.list({ prefix, limit: 100 });

        // @ts-ignore
        const files = listed.objects.map((obj: R2Object) => ({
            key: obj.key,
            size: obj.size,
            uploaded: obj.uploaded,
            name: obj.customMetadata?.originalName || obj.key.split('/').pop(),
        }));

        return Response.json({
            files,
            count: files.length,
        });

    } catch (error) {
        console.error('List files error:', error);
        return Response.json(
            { error: 'Failed to list files' },
            { status: 500 }
        );
    }
}
