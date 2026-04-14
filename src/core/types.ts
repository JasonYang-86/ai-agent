// 模型提供商配置
export interface ModelProvider {
  api_key?: string;
  provider: string;
  base_url: string;
  type: 'cloud' | 'local';
  model?: string;
  required?: boolean;
}

// 模型配置
export interface ModelConfig {
  model_providers: Record<string, ModelProvider>;
  agent_instances: Record<string, AgentInstance>;
}

// 代理实例配置
export interface AgentInstance {
  model: string;
  tools: string[];
  sandbox: boolean;
}

// 模型状态
export interface ModelStatus {
  name: string;
  type: string;
  status: 'available' | 'ready' | 'service_not_running' | 'not_installed';
}

// 工具执行选项
export interface ToolExecutorOptions {
  sandbox: boolean;
}

// 沙箱选项
export interface SandboxOptions {
  image?: string;
  volumes?: Record<string, {
    bind: string;
    mode: string;
  }>;
  networkMode?: string;
}

// 技能执行参数
export interface SkillParams {
  [key: string]: any;
}

// 技能配置
export interface SkillConfig {
  name: string;
  description: string;
  parameters: Record<string, {
    type: string;
    required: boolean;
    description: string;
  }>;
  steps: string[];
}

// 对话历史
export interface ChatHistory {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

// 任务状态
export interface TaskStatus {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  description: string;
  result?: any;
  error?: string;
  createdAt: number;
  updatedAt: number;
}