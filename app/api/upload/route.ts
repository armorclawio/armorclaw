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

// 默认限额配置
const GUEST_MAX_FILES = 1;
const GUEST_MAX_SIZE = 2 * 1024 * 1024; // 2MB
const USER_MAX_FILES = 10;
const USER_MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
    try {
        const ctx = await getCloudflareContext();
        const storage = ctx.env.STORAGE;
        const db = ctx.env.DB;

        if (!storage) {
            return Response.json({ error: 'Storage not available' }, { status: 500 });
        }

        // 1. 获取用户信息或客户端 IP
        const user = await getCurrentUser();
        const clientIP = request.headers.get('cf-connecting-ip') || 'anonymous';

        // 2. 确定限额 (未登录: 1个/2MB, 已登录: 10个/10MB)
        const isGuest = !user;
        const MAX_FILES = isGuest ? GUEST_MAX_FILES : USER_MAX_FILES;
        const CURRENT_MAX_SIZE = isGuest ? GUEST_MAX_SIZE : USER_MAX_SIZE;

        // 3. 统计已上传文件数量
        let existingCount = 0;
        let dbUserId: number | string | null = null;

        if (db) {
            if (user) {
                const dbUser = await getOrCreateDbUser(db, user);
                dbUserId = dbUser.id;
            } else {
                // 对游客，通过 ip:xxx 的方式记录
                dbUserId = `ip:${clientIP}`;
            }
            const result = await db.prepare('SELECT COUNT(*) as count FROM audits WHERE user_id = ?').bind(dbUserId).first();
            existingCount = (result?.count as number) || 0;
        }

        if (existingCount >= MAX_FILES) {
            return Response.json(
                { error: `Upload limit reached. ${isGuest ? 'Guests' : 'Logged-in users'} can only upload up to ${MAX_FILES} file(s).` },
                { status: 403 }
            );
        }

        // 4. 获取表单数据
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return Response.json({ error: 'No file provided' }, { status: 400 });
        }

        // 5. 验证文件大小
        if (file.size > CURRENT_MAX_SIZE) {
            return Response.json(
                { error: `File too large. ${isGuest ? 'Guest' : 'Logged-in user'} limit is ${CURRENT_MAX_SIZE / 1024 / 1024}MB` },
                { status: 400 }
            );
        }

        // 6. 验证文件类型
        const isValidType = ALLOWED_TYPES.includes(file.type);
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
        const ALLOWED_EXTENSIONS = [
            'c', 'h', 'o', 'so', 'elf', 'bin',
            'zip', 'tar', 'gz', 'tgz',
            'json', 'yaml', 'yml', 'md', 'txt'
        ];
        const isValidExtension = ALLOWED_EXTENSIONS.includes(fileExtension);

        if (!isValidType && !isValidExtension) {
            return Response.json(
                { error: 'Invalid file type. Please upload a valid eBPF skill file.' },
                { status: 400 }
            );
        }

        // 7. 生成唯一存储 Key
        const timestamp = Date.now();
        const randomId = crypto.randomUUID();
        const finalExtension = fileExtension || 'bin';
        const storageUserId = user ? user.userId : `guest-${clientIP.replace(/[:.]/g, '-')}`;
        const fileName = `${storageUserId}/${timestamp}-${randomId}.${finalExtension}`;

        // 8. 上传到 R2
        const fileBuffer = await file.arrayBuffer();
        await storage.put(fileName, fileBuffer, {
            httpMetadata: { contentType: file.type || 'application/octet-stream' },
            customMetadata: {
                originalName: file.name,
                uploadedBy: user ? user.userId : `guest:${clientIP}`,
                uploadedAt: new Date().toISOString(),
            },
        });

        // 9. 保存到数据库
        if (db && dbUserId) {
            try {
                await db.prepare(`
                    INSERT INTO audits (id, user_id, skill_name, skill_hash, status, created_at)
                    VALUES (?, ?, ?, ?, ?, datetime('now'))
                `).bind(
                    randomId,
                    dbUserId,
                    file.name,
                    fileName,
                    'pending'
                ).run();
            } catch (dbError) {
                console.error('Failed to save to database:', dbError);
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
        return Response.json({ error: 'Failed to upload file' }, { status: 500 });
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
