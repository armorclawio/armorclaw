/**
 * GLM-4 AI Service Integration
 * 智谱 AI 开放平台集成
 */

export interface GLMMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface GLMThinking {
    type: 'enabled' | 'disabled';
}

export interface GLMRequest {
    model: string;
    messages: GLMMessage[];
    thinking?: GLMThinking;
    max_tokens?: number;
    temperature?: number;
}

export interface GLMResponse {
    id: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

import { AnalysisResult } from '@/types';

/**
 * 调用 GLM-4 API 进行对话
 */
export async function callGLM4(
    messages: GLMMessage[],
    apiKey: string,
    options?: {
        model?: string;
        enableThinking?: boolean;
        maxTokens?: number;
        temperature?: number;
    }
): Promise<GLMResponse> {
    const requestBody: GLMRequest = {
        model: options?.model || 'glm-4-flash',
        messages,
        max_tokens: options?.maxTokens || 65536,
        temperature: options?.temperature ?? 1.0,
    };

    if (options?.enableThinking) {
        requestBody.thinking = { type: 'enabled' };
    }

    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GLM-4 API error: ${response.status} - ${errorText}`);
    }

    return await response.json() as GLMResponse;
}

/**
 * 分析 eBPF 文件的安全性
 */

export interface ProjectFile {
    name: string;
    content: string;
    size: number;
}

/**
 * 分析 eBPF 项目的安全性
 */
export async function analyzeEBPFFile(
    name: string,
    context: string | ArrayBuffer | ProjectFile[],
    apiKey: string
): Promise<AnalysisResult> {
    let files: ProjectFile[] = [];
    let filePreview = '';

    // 统一处理输入，将单文件或多文件都转换为文件列表格式
    if (Array.isArray(context)) {
        files = context;
        filePreview = files.map(f => `
File: ${f.name} (Size: ${f.size} bytes)
----------------------------------------
${f.content.substring(0, 8000)} // 截断过长的文件内容
----------------------------------------
`).join('\n\n');
    } else {
        // 单文件兼容模式
        let contentStr: string;
        if (typeof context === 'string') {
            contentStr = context;
        } else {
            const buffer = new Uint8Array(context);
            // 简单的二进制转 hex 预览，或者尝试作为文本解码（如果不含空字符）
            // 这里假设主要是文本分析，如果是纯二进制，AI 也看不懂
            // 为了兼容旧逻辑，我们保留 hex 预览作为 content
            const preview = Array.from(buffer.slice(0, 1000))
                .map(b => b.toString(16).padStart(2, '0'))
                .join(' ');
            contentStr = `Binary file (hex preview): ${preview}...`;
        }

        files = [{
            name: name,
            content: contentStr,
            size: contentStr.length
        }];

        filePreview = `
File: ${name}
----------------------------------------
${contentStr.substring(0, 8000)}
----------------------------------------
`;
    }

    const messages: GLMMessage[] = [
        {
            role: 'system',
            content: `你是一个专业的系统安全架构师，专注于 eBPF (Extended Berkeley Packet Filter) 项目的安全审计。
你的任务是深入分析整个项目代码，识别潜在的安全风险、逻辑漏洞以及不规范的编码实践。

尤其要注意跨文件分析：
1. 文件间的依赖关系和调用链。
2. 宏定义和常量的跨文件使用。
3. 共享 Map 的定义和使用是否一致且安全。
4. 任何可能的跨文件注入风险或资源泄露。

请从以下核心维度进行全面审计：
1. **内存安全**：检查缓冲区溢出、越界访问、内存泄漏（特别是 Map 和 Ring Buffer 的使用）。
2. **并发与竞态**：分析多核环境下的并发访问，Map 更新的原子性，以及用户态与内核态的交互逻辑。
3. **权限与能力**：检查程序类型、Helper 函数调用权限，是否遵循最小权限原则。
4. **资源限制**：CPU 复杂度（指令数量、循环），栈空间使用，Map 容量限制。
5. **输入验证**：所有来自用户态或网络包的输入是否经过严格验证。
6. **逻辑正确性**：业务逻辑是否存在漏洞，错误处理是否完善。

请以严格的 JSON 格式返回分析结果，格式如下：
{
  "score": 0-100, // 总体安全评分
  "status": "passed" | "warning" | "failed", // 总体状态
  "summary": {
    "total_checks": number,
    "passed": number,
    "warnings": number,
    "critical": number
  },
  "checks": [
    {
      "category": string, // 例如 "内存安全", "并发控制"
      "status": "passed" | "warning" | "critical",
      "details": string, // 详细描述发现的问题或通过的理由
      "severity": "info" | "warning" | "critical"
    }
  ],
  "recommendations": [
    string // 针对性的修复建议
  ],
  "metadata": {
    "analyzed_at": string, // ISO 日期
    "analyzer_version": "2.0.0-ai-architect",
    "file_name": string // 项目名称
  }
}

确保返回的是纯 JSON，不要包含 markdown 标记或额外说明。`
        },
        {
            role: 'user',
            content: `请对以下 eBPF 项目进行安全审计：

项目名称: ${name}

项目文件内容:
${filePreview}

请提供详细、专业的安全分析报告。`
        }
    ];

    try {
        const response = await callGLM4(messages, apiKey, {
            model: 'glm-4-flash',
            enableThinking: true,
            temperature: 0.3, // 降低温度以获得更严谨的分析
            maxTokens: 8192 // 增加 token 限制以容纳更长的项目分析
        });

        const aiContent = response.choices[0]?.message?.content;
        if (!aiContent) {
            throw new Error('AI 返回内容为空');
        }

        // 尝试从 AI 响应中提取 JSON
        let analysisResult: AnalysisResult;
        try {
            // 移除可能的 markdown 代码块标记
            const jsonContent = aiContent
                .replace(/^```json\s*/, '')
                .replace(/^```\s*/, '')
                .replace(/\s*```$/, '')
                .trim();

            analysisResult = JSON.parse(jsonContent);
        } catch (parseError) {
            console.error('Failed to parse AI response as JSON:', aiContent);
            // 这里可以尝试更激进的 JSON 提取或返回部分结果
            analysisResult = {
                score: 0,
                status: 'failed',
                summary: { total_checks: 0, passed: 0, warnings: 0, critical: 1 },
                checks: [{
                    category: 'Result Parsing',
                    status: 'critical',
                    details: 'AI response was not valid JSON. see details for raw output.',
                    severity: 'critical'
                }],
                recommendations: ['Review raw AI output'],
                metadata: {
                    analyzed_at: new Date().toISOString(),
                    analyzer_version: '2.0.0-error',
                    file_name: name
                }
            };
        }

        // 确保包含元数据
        if (!analysisResult.metadata) {
            analysisResult.metadata = {
                analyzed_at: new Date().toISOString(),
                analyzer_version: '2.0.0-ai-architect',
                file_name: name,
            };
        }

        return analysisResult;

    } catch (error) {
        console.error('AI analysis error:', error);
        throw error;
    }
}

/**
 * 通用的 AI 对话接口
 * 可用于其他场景的 AI 交互
 */
export async function chatWithAI(
    userMessage: string,
    apiKey: string,
    conversationHistory?: GLMMessage[],
    systemPrompt?: string
): Promise<string> {
    const messages: GLMMessage[] = [];

    if (systemPrompt) {
        messages.push({
            role: 'system',
            content: systemPrompt,
        });
    }

    if (conversationHistory) {
        messages.push(...conversationHistory);
    }

    messages.push({
        role: 'user',
        content: userMessage,
    });

    const response = await callGLM4(messages, apiKey, {
        model: 'glm-4-flash',
        enableThinking: false,
    });

    return response.choices[0]?.message?.content || '';
}
