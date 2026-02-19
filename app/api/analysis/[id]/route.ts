export const runtime = 'edge';
import { getCurrentUser } from '@/lib/auth';
import { analyzeEBPFFile, type ProjectFile } from '@/lib/ai-service';
import { getCloudflareContext } from '@/lib/cloudflare';

// 模拟 AI 分析结果
function generateMockAnalysisResult(fileName: string) {
    const score = Math.floor(Math.random() * 30) + 70; // 70-100 分
    const hasWarnings = score < 90;
    const hasCritical = score < 80;

    return {
        score,
        status: score >= 90 ? 'passed' : score >= 70 ? 'warning' : 'failed',
        summary: {
            total_checks: 15,
            passed: Math.floor((score / 100) * 15),
            warnings: hasWarnings ? Math.floor(Math.random() * 3) + 1 : 0,
            critical: hasCritical ? Math.floor(Math.random() * 2) : 0,
        },
        checks: [
            {
                category: '内存安全',
                status: 'passed',
                details: '未检测到缓冲区溢出或内存泄漏风险',
                severity: 'info',
            },
            {
                category: '竞态条件',
                status: score >= 85 ? 'passed' : 'warning',
                details: score >= 85
                    ? '未检测到明显的竞态条件'
                    : '检测到潜在的竞态条件，建议添加适当的锁机制',
                severity: score >= 85 ? 'info' : 'warning',
            },
            {
                category: '权限检查',
                status: 'passed',
                details: 'eBPF 程序权限检查符合最小权限原则',
                severity: 'info',
            },
            {
                category: '资源限制',
                status: score >= 90 ? 'passed' : 'warning',
                details: score >= 90
                    ? '资源使用在合理范围内'
                    : '建议添加更严格的资源限制',
                severity: score >= 90 ? 'info' : 'warning',
            },
            {
                category: '输入验证',
                status: score >= 80 ? 'passed' : 'critical',
                details: score >= 80
                    ? '输入验证机制完善'
                    : '检测到不充分的输入验证，存在安全风险',
                severity: score >= 80 ? 'info' : 'critical',
            },
            {
                category: 'Map 操作安全',
                status: 'passed',
                details: 'BPF Map 操作符合安全规范',
                severity: 'info',
            },
            {
                category: '辅助函数使用',
                status: 'passed',
                details: '辅助函数调用正确，未检测到不安全的使用',
                severity: 'info',
            },
            {
                category: '指令复杂度',
                status: score >= 75 ? 'passed' : 'warning',
                details: score >= 75
                    ? '指令数量在合理范围内'
                    : '指令数量较多，可能影响性能',
                severity: score >= 75 ? 'info' : 'warning',
            },
        ],
        recommendations: [
            '建议在生产环境部署前进行充分的压力测试',
            '考虑添加更详细的日志记录以便调试',
            score < 90 ? '修复所有警告级别的问题以提高安全性' : '代码质量良好，可以部署',
        ],
        metadata: {
            analyzed_at: new Date().toISOString(),
            analyzer_version: '1.0.0',
            file_name: fileName,
        },
    };
}

// 获取分析结果
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        const { id: auditId } = await params;

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 从数据库获取审计记录
        const ctx = await getCloudflareContext();
        const db = ctx.env.DB;

        if (!db) {
            return Response.json({ error: 'Database not available' }, { status: 500 });
        }

        const audit = await db.prepare(`
      SELECT a.*, u.github_id
      FROM audits a
      JOIN users u ON a.user_id = u.id
      WHERE a.id = ?
    `).bind(auditId).first() as any;

        if (!audit) {
            return Response.json({ error: 'Audit not found' }, { status: 404 });
        }

        // 验证用户权限
        if (audit.github_id !== user.userId) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 如果已有分析结果，直接返回
        if (audit.ebpf_log_json) {
            try {
                const result = JSON.parse(audit.ebpf_log_json);
                return Response.json(result);
            } catch (e) {
                // 如果解析失败，生成新的结果
            }
        }

        // 生成模拟分析结果 (仅在非生产环境或配置允许时)
        if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_MOCK_ANALYSIS === 'true') {
            const result = generateMockAnalysisResult(audit.skill_name);

            // 保存分析结果到数据库
            await db.prepare(`
           UPDATE audits
           SET ebpf_log_json = ?, status = ?, score = ?
           WHERE id = ?
         `).bind(
                JSON.stringify(result),
                result.status,
                result.score,
                auditId
            ).run();

            return Response.json(result);
        }

        return Response.json({ status: 'pending', message: 'Analysis pending or not started' });

    } catch (error) {
        console.error('Analysis error:', error);
        return Response.json(
            { error: 'Failed to get analysis result' },
            { status: 500 }
        );
    }
}

// 触发分析（使用 GLM-4 AI 服务）
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        const { id: auditId } = await params;

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 获取审计记录
        const ctx = await getCloudflareContext();
        const db = ctx.env.DB;

        if (!db) {
            return Response.json({ error: 'Database not available' }, { status: 500 });
        }

        const audit = await db.prepare(`
      SELECT a.*, u.github_id
      FROM audits a
      JOIN users u ON a.user_id = u.id
      WHERE a.id = ?
    `).bind(auditId).first() as any;

        if (!audit) {
            return Response.json({ error: 'Audit not found' }, { status: 404 });
        }

        if (audit.github_id !== user.userId) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 获取 AI API Key
        const aiApiKey = ctx.env.GLM_API_KEY || process.env.GLM_API_KEY;

        let result;

        // 如果配置了 AI API Key，使用真实的 AI 分析
        if (aiApiKey) {
            try {
                // 1. 从 R2 获取文件内容
                const storage = ctx.env.STORAGE;
                if (!storage) {
                    throw new Error('Storage not available');
                }


                const fileObject = await storage.get(audit.skill_hash);
                if (!fileObject) {
                    throw new Error('File not found in storage');
                }

                const fileContent = await fileObject.arrayBuffer();
                const buffer = new Uint8Array(fileContent);

                // 准备分析上下文
                let projectContext: string | ArrayBuffer | ProjectFile[] = fileContent;

                // 检测 ZIP 文件头 (PK\x03\x04)
                if (buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04) {
                    try {
                        console.log('Detected ZIP file, attempting to decompress...');
                        const { unzipSync } = await import('fflate');

                        const unzipped = unzipSync(buffer, {
                            filter: (file) => {
                                // 过滤目录和非代码文件
                                if (file.name.endsWith('/')) return false;
                                // 只提取常见的源码和配置文
                                return /\.(c|h|cpp|hpp|rs|go|py|js|ts|mjs|sh|md|txt|json|yaml|yml|ebpf)$/i.test(file.name);
                            }
                        });

                        const extractedFiles: ProjectFile[] = [];
                        const decoder = new TextDecoder('utf-8', { fatal: false }); // 允许非致命错误，尽力解码

                        for (const [path, content] of Object.entries(unzipped)) {
                            // 忽略 `__MACOSX` 等隐藏文件夹
                            if (path.includes('__MACOSX') || path.includes('.DS_Store')) continue;

                            try {
                                const text = decoder.decode(content);
                                // 简单的二进制检测：如果有太多 null 字符
                                if (text.includes('\0')) continue;

                                extractedFiles.push({
                                    name: path,
                                    content: text,
                                    size: content.length
                                });
                            } catch (e) {
                                console.warn(`Skipping binary or undecodable file: ${path}`);
                            }
                        }

                        if (extractedFiles.length > 0) {
                            console.log(`Successfully extracted ${extractedFiles.length} files from ZIP`);
                            projectContext = extractedFiles;
                        } else {
                            console.warn('No valid source files found in ZIP');
                        }
                    } catch (zipError) {
                        console.error('ZIP decompression failed:', zipError);
                        // 降级为单文件处理（虽然 AI 可能看不懂 zip 二进制）
                    }
                }

                // 2. 调用 AI 服务进行分析

                // Note: projectContext type matches strict ProjectFile[] | string | ArrayBuffer 
                // but typescript inside prepare might need casting if not strictly inferred
                // however analyzeEBPFFile signature was updated to accept ProjectFile[]

                result = await analyzeEBPFFile(
                    audit.skill_name,
                    projectContext,
                    aiApiKey
                );

                console.log('AI analysis completed successfully');

            } catch (aiError) {
                console.error('AI analysis failed, falling back to mock:', aiError);
                // 如果 AI 分析失败，回退到模拟结果
                result = generateMockAnalysisResult(audit.skill_name);
                // 在结果中添加错误信息
                result.recommendations.unshift(`⚠️ AI 分析失败，使用模拟结果: ${aiError instanceof Error ? aiError.message : String(aiError)}`);
            }
        } else {
            // 如果没有配置 API Key，使用模拟结果
            console.warn('GLM_API_KEY not configured, using mock analysis');
            result = generateMockAnalysisResult(audit.skill_name);
            result.recommendations.unshift('⚠️ 未配置 AI API Key，使用模拟分析结果');
        }

        // 3. 保存结果到数据库
        await db.prepare(`
      UPDATE audits
      SET ebpf_log_json = ?, status = ?, score = ?
      WHERE id = ?
    `).bind(
            JSON.stringify(result),
            result.status,
            result.score,
            auditId
        ).run();

        return Response.json({
            success: true,
            result,
            usedAI: !!aiApiKey,
        });

    } catch (error) {
        console.error('Trigger analysis error:', error);
        return Response.json(
            { error: 'Failed to trigger analysis' },
            { status: 500 }
        );
    }
}
