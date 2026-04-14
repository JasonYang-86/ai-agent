# AI Agent

本项目是一个基于开源 AI 框架开发的通用 AI 代理系统，功能参考 OpenClaw。

**免责声明**：本项目仅用于学习和练习目的，不涉及任何商业用途。

**开发声明**：本项目所有内容由TRAE进行开发。

## 功能特性

- **多模型支持**：无缝集成云端主流大模型和本地部署模型
- **功能完备性**：实现任务规划、工具调用、代码生成与调试能力
- **企业级安全**：提供操作沙箱、权限控制和审计日志
- **生态可扩展**：通过 Skills 技能包机制，支持用户自定义功能插件
- **终端友好**：提供直观的命令行交互界面

## 运行环境

- **操作系统**：支持 macOS、Linux (Ubuntu/CentOS) 及 Windows 11 (WSL2)
- **Node.js**：>= 22.12.0
- **Docker**：20.0+ (用于安全沙箱)
- **Ollama**：最新版 (可选，仅用于本地模型)

## 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd trae-agent
   ```

2. **安装依赖**
   ```bash
   # 安装 pnpm
   npm install -g pnpm
   
   # 安装项目依赖
   pnpm install
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，添加 API key
   ```

4. **构建项目**
   ```bash
   pnpm run build
   ```

5. **启动服务**
   ```bash
   pnpm start
   ```

## 基本命令

### 模型管理
- `model list` - 列出所有可用模型
- `model switch <model>` - 切换到指定模型
- `model current` - 显示当前模型
- `model add <name>` - 添加新模型
- `model update <name>` - 更新模型配置
- `model delete <name>` - 删除模型

### 技能管理
- `skill list` - 列出所有可用技能
- `skill execute <skill>` - 执行技能

### 记忆管理
- `memory clear` - 清空记忆

### 工具执行
- `tool execute <command>` - 执行工具命令

## 示例使用流程

```bash
# 启动 CLI
pnpm start

# 查看可用模型
>>> model list

# 切换到本地模型
>>> model switch ollama

# 执行任务
>>> 帮我创建一个 Python 脚本，实现 Fibonacci 数列

# 添加新的云端模型
>>> model add my_gpt
Model type: cloud
Base URL: https://api.openai.com/v1
API Key: sk-xxxxxxxxxxxxxxxx

# 切换到新模型
>>> model switch my_gpt

# 执行另一个任务
>>> 帮我分析这个 Python 脚本的性能问题
```

## 项目结构

```
trae-agent/
├── src/              # 源代码
│   ├── cli/          # 命令行界面
│   ├── core/         # 核心功能
│   ├── models/       # 模型管理
│   ├── tools/        # 工具系统
│   ├── skills/       # 技能系统
│   ├── sandbox/      # 安全沙箱
│   └── memory/       # 记忆系统
├── config/           # 配置文件
├── skills/           # 技能包目录
├── package.json      # 项目配置
├── tsconfig.json     # TypeScript 配置
└── README.md         # 文档
```

## 配置文件

配置文件位于 `config/trae_config.yaml`，包含模型提供商和代理实例的配置。

## 技能包

技能包位于 `skills/` 目录，使用 SKILL.md 格式定义。

## 安全考虑

- **沙箱隔离**：所有外部命令在 Docker 容器中执行
- **权限控制**：支持操作前用户审批
- **环境变量管理**：API key 存储在环境变量中，避免硬编码
- **审计日志**：记录所有操作，便于追溯

## 许可证

本项目采用 MIT 许可证。