# ArmorClaw 🛡️

**ArmorClaw** 是一个融合了极简交互美学与工业级审计能力的 AI + eBPF 安全分析平台。

## 🌟 项目核心定位

- **产品形态**：融合 Gemini 极简美学前端与 Jenkins 工业级审计流后端。
- **核心技术**：深耕 C/C++/eBPF，利用 AI 与 eBPF 技术在内核层对上传的 Skills 文件进行非侵入式、高性能的动态行为审计。
- **安全沙箱**：作为 OpenClaw 的“护卫”，利用 Docker 与 eBPF 实时监控容器行为，提供透明的安全性验证。

## ✨ 核心特性

- **AI 驱动分析**：集成高级 AI 模型，对 eBPF 行为日志进行智能化解读与安全评分。
- **非侵入审计**：无需修改代码，通过内核探针实现高性能的系统调用、文件与网络权限监控。
- **不可变审计指纹**：基于文件 Hash 生成唯一“审计画像”，确保版本管理与信任背书。
- **极简交互**：提供直观的“安全画像”展现，将复杂的内核数据转化为易懂的安全场景。

## 🛠️ 技术栈

- **Frontend**: Next.js 15+, React, Tailwind CSS (Modern Glassmorphism Design)
- **Backend/Edge**: Cloudflare Pages & Workers, D1 Database
- **Auth**: GitHub OAuth
- **Storage**: Cloudflare R2
- **Infrastructure**: eBPF (Extended Berkeley Packet Filter), Docker

## 🚀 快速开始

### 开发环境配置

1. **安装依赖**
   ```bash
   npm install
   ```

2. **环境变量**
   复制 `.dev.vars.example` 为 `.dev.vars` 并填入必要信息：
   - GitHub Client ID/Secret
   - Cloudflare R2 Credentials
   - Gemini API Key

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

### 部署

本项目专为 Cloudflare 平台设计：

```bash
# 部署到 Cloudflare Pages
npx wrangler pages deploy .
```

## 📂 目录说明

- `app/` - 核心业务逻辑与路由
- `components/` - 高级 UI 组件库
- `docs/` - 项目详细规划与文档
- `lib/` - 工具函数与 API 封装
- `migrations/` - D1 数据库迁移脚本

---

## 📄 开源协议

本项目遵循 MIT 协议。
