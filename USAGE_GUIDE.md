# AI Agent 项目使用指南

## 1. 项目介绍

### 1.1 基本概述
本项目是一个基于开源 AI 框架开发的通用 AI 代理系统，功能参考 OpenClaw。该系统提供了一个高度模块化、可扩展的智能体平台，通过自然语言指令驱动，执行复杂的软件工程与系统自动化任务。

**免责声明**：本项目仅用于学习和练习目的，不涉及任何商业用途。

### 1.2 核心功能
- **多模型支持**：无缝集成云端主流大模型和本地部署模型
- **自然语言交互**：理解用户意图，进行任务分解与多轮对话
- **工具执行引擎**：执行 Bash 命令、编辑文件、发送 HTTP 请求等
- **技能包系统**：将复杂工作流封装成可复用的 SKILL.md 插件
- **安全沙箱**：在 Docker 容器中隔离执行高风险操作，支持权限审批
- **记忆与上下文**：维护对话历史与任务状态，实现长程任务规划
- **智能语言处理**：根据用户语言自动调整回答语言
- **响应清理**：自动检测和移除重复内容，提高响应质量

### 1.3 技术栈
- **开发语言**：TypeScript
- **运行环境**：Node.js >= 22.12.0
- **包管理**：pnpm
- **核心框架**：Trae-Agent（字节跳动开源）
- **终端界面**：@clack/prompts、chalk
- **配置管理**：yaml
- **网络请求**：axios
- **容器化**：Docker（用于安全沙箱）

### 1.4 适用场景
- **软件开发**：代码生成、调试、文档编写
- **系统管理**：自动化脚本执行、系统配置
- **数据处理**：数据分析、文件处理
- **内容创作**：文章写作、创意生成
- **学习辅助**：问题解答、知识获取

### 1.5 主要优势
- **灵活性**：支持多种模型的无缝切换，满足不同场景需求
- **易用性**：提供直观的命令行界面和交互式配置
- **智能性**：自动语言检测和响应清理，提升用户体验
- **安全性**：通过沙箱机制确保操作安全
- **可扩展性**：模块化架构支持功能扩展

## 2. 项目使用方法

### 2.1 环境准备与依赖安装

#### 2.1.1 系统要求
- **操作系统**：Windows 11 (WSL2)、macOS 或 Linux
- **Node.js**：>= 22.12.0
- **Docker**：20.0+（用于安全沙箱）
- **Ollama**：最新版（可选，仅用于本地模型）

#### 2.1.2 安装步骤
1. **安装 Node.js**：
   - 访问 [Node.js 官网](https://nodejs.org/) 下载并安装最新版本
   - 验证安装：`node --version`

2. **安装 pnpm**：
   ```bash
   npm install -g pnpm
   ```

3. **安装 Docker**（可选，用于安全沙箱）：
   - 访问 [Docker 官网](https://www.docker.com/) 下载并安装 Docker Desktop
   - 启动 Docker 服务

4. **安装 Ollama**（可选，用于本地模型）：
   - 访问 [Ollama 官网](https://ollama.ai/) 下载并安装
   - 启动 Ollama 服务：`ollama serve`

5. **克隆项目**：
   ```bash
   git clone <repository-url>
   cd trae-agent
   ```

6. **安装依赖**：
   ```bash
   pnpm install
   ```

7. **配置环境变量**：
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，添加 API Key（如果使用云端模型）
   ```

### 2.2 项目初始化与启动

#### 2.2.1 初始化项目
1. **构建项目**：
   ```bash
   pnpm run build
   ```

2. **验证构建**：
   ```bash
   pnpm run lint
   ```

#### 2.2.2 启动项目
1. **启动 CLI**：
   ```bash
   pnpm start
   ```

2. **启动参数**：
   - 直接启动交互式界面：`pnpm start`
   - 执行特定命令：`pnpm start <command> [options]`

### 2.3 基本操作命令与参数说明

#### 2.3.1 核心命令
| 命令 | 描述 | 示例 |
|------|------|------|
| `model list` | 列出所有可用模型 | `pnpm start model list` |
| `model current` | 显示当前模型 | `pnpm start model current` |
| `model switch <model>` | 切换到指定模型 | `pnpm start model switch ollama` |
| `model add <name>` | 添加新模型 | `pnpm start model add my_model` |
| `model update <name>` | 更新模型配置 | `pnpm start model update my_model` |
| `model delete <name>` | 删除模型 | `pnpm start model delete my_model` |
| `model select` | 交互式模型选择和配置 | `pnpm start model select` |
| `skill list` | 列出所有可用技能 | `pnpm start skill list` |
| `skill execute <skill>` | 执行技能 | `pnpm start skill execute git_commit` |
| `memory clear` | 清空记忆 | `pnpm start memory clear` |
| `tool execute <command>` | 执行工具命令 | `pnpm start tool execute ls -la` |

#### 2.3.2 交互式命令
在启动后的交互式界面中，可以直接输入命令或任务描述：
- `exit`：退出 CLI
- `help`：显示帮助信息
- `model <command>`：执行模型相关命令
- `skill <command>`：执行技能相关命令
- `memory <command>`：执行记忆相关命令
- `tool <command>`：执行工具相关命令
- 其他输入：作为 AI 任务处理

### 2.4 常见功能模块的使用示例

#### 2.4.1 模型管理
```bash
# 列出所有模型
>>> model list

# 切换到本地模型
>>> model switch ollama

# 添加新的云端模型
>>> model add my_gpt
Model type: cloud
Base URL: https://api.openai.com/v1
API Key: sk-xxxxxxxxxxxxxxxx

# 交互式模型配置
>>> model select
# 选择预定义模型或自定义模型，输入相关配置
```

#### 2.4.2 AI 任务处理
```bash
# 基本对话
>>> 你好
>>> 帮我写一篇200字的小作文

# 代码生成
>>> 帮我写一个 Python 脚本，实现 Fibonacci 数列

# 系统命令
>>> 帮我查看当前目录下的文件

# 网络请求
>>> 帮我访问 https://api.github.com/users/octocat
```

#### 2.4.3 技能执行
```bash
# 列出技能
>>> skill list

# 执行技能
>>> skill execute git_commit
# 输入技能参数
```

### 2.5 注意事项与故障排除

#### 2.5.1 注意事项
- **模型配置**：云端模型需要有效的 API Key，本地模型需要安装并运行 Ollama
- **安全考虑**：敏感操作会在沙箱中执行，请确保 Docker 服务正常运行
- **性能优化**：首次模型调用可能较慢，后续会缓存优化
- **资源限制**：本地模型响应速度取决于硬件配置
- **编码问题**：确保系统使用 UTF-8 编码，避免中文乱码

#### 2.5.2 故障排除
| 问题 | 原因 | 解决方案 |
|------|------|---------|
| API Key 无效 | API Key 错误或过期 | 检查 .env 文件中的配置，确保 API Key 正确 |
| Ollama 未运行 | Ollama 服务未启动 | 执行 `ollama serve` 启动服务 |
| Docker 权限问题 | 用户无 Docker 访问权限 | 确保用户有 Docker 访问权限，或使用 sudo 运行 |
| 模型响应慢 | 网络延迟或模型加载 | 检查网络连接，考虑使用本地模型 |
| 响应乱码 | 编码问题或模型生成问题 | 确保系统使用 UTF-8 编码，尝试切换模型 |
| 命令执行失败 | 权限不足或命令错误 | 检查命令权限，确保命令正确 |

## 3. 模型配置与管理

### 3.1 模型下载、安装与配置

#### 3.1.1 云端模型
1. **选择模型**：
   - 支持 OpenRouter、豆包、DeepSeek、GPT 等云端模型
   - 通过 `model select` 命令进行交互式配置

2. **配置参数**：
   - **模型 ID**：模型的唯一标识符
   - **API Key**：访问模型 API 的密钥
   - **基础 URL**：模型 API 的访问地址

3. **环境变量**：
   - 建议在 `.env` 文件中存储 API Key，避免硬编码
   - 格式：`MODEL_NAME_API_KEY=sk-xxxxxxxxxxxxxxxx`

#### 3.1.2 本地模型
1. **安装 Ollama**：
   - 访问 [Ollama 官网](https://ollama.ai/) 下载并安装
   - 启动 Ollama 服务：`ollama serve`

2. **下载模型**：
   ```bash
   ollama pull llama3
   ollama pull qwen:7b
   ```

3. **配置参数**：
   - **模型 ID**：本地模型的名称（如 llama3、qwen:7b）
   - **基础 URL**：默认 `http://localhost:11434/api`

### 3.2 模型参数设置

#### 3.2.1 通用参数
| 参数 | 描述 | 默认值 | 推荐值 |
|------|------|--------|--------|
| `temperature` | 生成温度，控制输出的随机性 | 0.7 | 0.5-0.7 |
| `max_tokens` | 最大生成 token 数 | 2000 | 1000-3000 |
| `top_p` | 核采样参数，控制输出的多样性 | 0.9 | 0.8-0.95 |
| `frequency_penalty` | 频率惩罚，减少重复内容 | 0.1 | 0.0-0.2 |
| `presence_penalty` | 存在惩罚，鼓励新内容 | 0.1 | 0.0-0.2 |

#### 3.2.2 模型特定参数
- **OpenAI 模型**：支持 `stop`、`n` 等参数
- **本地模型**：支持 `mirostat`、`mirostat_eta` 等参数

### 3.3 模型更新与版本管理

#### 3.3.1 云端模型
- **版本更新**：云端模型通常由服务提供商自动更新
- **API 版本**：在配置文件中指定 API 版本

#### 3.3.2 本地模型
- **更新模型**：
  ```bash
  ollama pull llama3
  ```

- **查看版本**：
  ```bash
  ollama list
  ```

- **管理版本**：
  ```bash
  ollama rm llama3:old
  ```

### 3.4 模型删除与清理

#### 3.4.1 删除云端模型
1. **切换到其他模型**：
   ```bash
   pnpm start model switch ollama
   ```

2. **删除模型**：
   ```bash
   pnpm start model delete <model-name>
   ```

#### 3.4.2 删除本地模型
1. **删除 Ollama 模型**：
   ```bash
   ollama rm <model-name>
   ```

2. **清理缓存**：
   ```bash
   ollama prune
   ```

### 3.5 多模型共存与切换

#### 3.5.1 模型切换
- **临时切换**：
  ```bash
  pnpm start model switch <model-name>
  ```

- **默认模型**：
  - 在 `config/trae_config.yaml` 中设置 `agent_instances.default.model`

#### 3.5.2 模型选择策略
- **根据任务类型选择**：
  - 代码生成：选择编程能力强的模型（如 DeepSeek-Coder）
  - 内容创作：选择创意能力强的模型（如 GPT-4、Claude）
  - 数学推理：选择逻辑能力强的模型（如 Qwen-Math）

- **根据网络环境选择**：
  - 网络良好：使用云端模型
  - 网络受限：使用本地模型

- **根据资源情况选择**：
  - 硬件资源充足：使用大型本地模型
  - 硬件资源有限：使用小型本地模型或云端模型

## 4. 高级功能

### 4.1 技能包开发
- **创建技能**：在 `skills` 目录中创建 SKILL.md 文件
- **技能格式**：遵循 Trae-Agent 技能包规范
- **技能参数**：支持自定义参数和验证

### 4.2 工具扩展
- **添加工具**：在 `src/tools` 目录中添加新工具
- **工具注册**：在配置文件中注册工具
- **工具权限**：设置工具的安全级别

### 4.3 插件系统
- **开发插件**：遵循插件开发规范
- **安装插件**：将插件放入 `plugins` 目录
- **启用插件**：在配置文件中启用插件

## 5. 常见问题

### 5.1 技术问题
- **Q**: 为什么模型响应慢？
  **A**: 可能是网络延迟或模型加载，尝试使用本地模型或检查网络连接。

- **Q**: 为什么中文输出有乱码？
  **A**: 确保系统使用 UTF-8 编码，尝试切换到中文优化的模型。

- **Q**: 为什么工具执行失败？
  **A**: 可能是权限不足或命令错误，检查命令权限和正确性。

### 5.2 配置问题
- **Q**: 如何添加新的模型？
  **A**: 使用 `model add <name>` 命令或 `model select` 交互式配置。

- **Q**: 如何设置默认模型？
  **A**: 在 `config/trae_config.yaml` 中设置 `agent_instances.default.model`。

- **Q**: 如何管理 API Key？
  **A**: 在 `.env` 文件中存储 API Key，避免硬编码。

### 5.3 性能问题
- **Q**: 如何提高模型响应速度？
  **A**: 使用本地模型、优化模型参数、减少输入长度。

- **Q**: 如何减少内存使用？
  **A**: 使用小型模型、清理记忆、限制并发请求。

## 6. 总结

本项目是一个功能强大、灵活易用的通用 AI 代理系统，通过自然语言指令驱动，能够执行各种复杂的任务。本指南提供了详细的使用方法和配置说明，帮助用户快速上手并充分利用系统的各种功能。

通过合理配置模型、使用技能包和工具，用户可以将本项目打造成一个个性化的 AI 助手，满足各种场景的需求。随着模型技术的不断发展，本项目也将持续进化，为用户提供更强大、更智能的服务。

---

**注意**：本指南仅供参考，具体操作可能因系统环境和版本不同而有所差异。如有问题，请参考项目文档或联系开发团队。