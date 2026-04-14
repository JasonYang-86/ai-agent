import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { ModelProvider, ModelConfig, ModelStatus } from '../core/types';
import { execSync } from 'child_process';

export class ModelManager {
  private configPath: string;
  private config: ModelConfig;
  private currentModel: string;

  constructor(configPath: string) {
    this.configPath = configPath;
    this.config = this.loadConfig();
    this.currentModel = 'default';
    this.checkModelDependencies();
  }

  /**
   * 加载配置文件
   */
  private loadConfig(): ModelConfig {
    if (!fs.existsSync(this.configPath)) {
      throw new Error(`配置文件不存在: ${this.configPath}`);
    }

    const content = fs.readFileSync(this.configPath, 'utf-8');
    const config = yaml.parse(content) as ModelConfig;

    // 替换环境变量
    for (const [name, provider] of Object.entries(config.model_providers)) {
      if (provider.api_key && provider.api_key.startsWith('${') && provider.api_key.endsWith('}')) {
        const envVar = provider.api_key.substring(2, provider.api_key.length - 1);
        provider.api_key = process.env[envVar] || '';
      }
    }

    return config;
  }

  /**
   * 保存配置文件
   */
  private saveConfig(): void {
    const content = yaml.stringify(this.config);
    fs.writeFileSync(this.configPath, content, 'utf-8');
  }

  /**
   * 检查模型依赖
   */
  private checkModelDependencies(): void {
    const currentInstance = this.config.agent_instances[this.currentModel];
    if (!currentInstance) {
      throw new Error(`代理实例 ${this.currentModel} 不存在`);
    }

    const modelName = currentInstance.model;
    const modelConfig = this.config.model_providers[modelName];

    if (modelConfig && modelConfig.type === 'local' && modelConfig.required) {
      this.checkOllamaInstallation();
    }
  }

  /**
   * 检查 Ollama 安装状态
   */
  private checkOllamaInstallation(): void {
    try {
      execSync('ollama --version', { stdio: 'ignore' });
      // 检查 Ollama 服务是否运行
      const http = require('http');
      const options = {
        hostname: 'localhost',
        port: 11434,
        path: '/api/tags',
        method: 'GET',
        timeout: 2000
      };

      const req = http.request(options, (res: any) => {
        if (res.statusCode !== 200) {
          console.warn('Ollama 服务未运行，请启动 Ollama 服务');
        }
      });

      req.on('error', () => {
        console.warn('Ollama 服务未运行，请启动 Ollama 服务');
      });

      req.end();
    } catch (error) {
      console.warn('Ollama 未安装，请安装 Ollama 以使用本地模型');
    }
  }

  /**
   * 列出所有模型
   */
  public listModels(): ModelStatus[] {
    const models: ModelStatus[] = [];

    for (const [name, config] of Object.entries(this.config.model_providers)) {
      const modelStatus: ModelStatus = {
        name,
        type: config.type,
        status: 'available'
      };

      // 检查本地模型状态
      if (config.type === 'local' && config.required) {
        try {
          execSync('ollama --version', { stdio: 'ignore' });
          const http = require('http');
          const options = {
            hostname: 'localhost',
            port: 11434,
            path: '/api/tags',
            method: 'GET',
            timeout: 2000
          };

          const req = http.request(options, (res: any) => {
            if (res.statusCode === 200) {
              modelStatus.status = 'ready';
            } else {
              modelStatus.status = 'service_not_running';
            }
          });

          req.on('error', () => {
            modelStatus.status = 'service_not_running';
          });

          req.end();
        } catch (error) {
          modelStatus.status = 'not_installed';
        }
      }

      models.push(modelStatus);
    }

    return models;
  }

  /**
   * 切换模型
   */
  public switchModel(modelName: string): boolean {
    if (!this.config.model_providers[modelName]) {
      console.error(`模型 ${modelName} 不存在`);
      return false;
    }

    const modelConfig = this.config.model_providers[modelName];

    // 检查本地模型依赖
    if (modelConfig.type === 'local' && modelConfig.required) {
      try {
        execSync('ollama --version', { stdio: 'ignore' });
        const http = require('http');
        const options = {
          hostname: 'localhost',
          port: 11434,
          path: '/api/tags',
          method: 'GET',
          timeout: 2000
        };

        let serviceRunning = false;
        const req = http.request(options, (res: any) => {
          if (res.statusCode === 200) {
            serviceRunning = true;
          }
        });

        req.on('error', () => {
          serviceRunning = false;
        });

        req.end();

        if (!serviceRunning) {
          console.error('Ollama 服务未运行，请启动 Ollama 服务');
          return false;
        }
      } catch (error) {
        console.error('Ollama 未安装，请安装 Ollama 以使用本地模型');
        return false;
      }
    }

    // 切换模型
    this.config.agent_instances[this.currentModel].model = modelName;
    this.saveConfig();

    console.log(`已切换到模型: ${modelName}`);
    return true;
  }

  /**
   * 添加新模型
   */
  public addModel(name: string, type: 'cloud' | 'local', baseUrl: string, apiKey?: string, modelId?: string, required: boolean = false): boolean {
    if (this.config.model_providers[name]) {
      console.error(`模型 ${name} 已存在，请使用 updateModel 修改`);
      return false;
    }

    // 创建模型配置
    const modelConfig: ModelProvider = {
      provider: name,
      type,
      base_url: baseUrl,
      required
    };

    if (apiKey) {
      modelConfig.api_key = apiKey;
    }

    if (modelId) {
      modelConfig.model = modelId;
    }

    // 添加到配置
    this.config.model_providers[name] = modelConfig;
    this.saveConfig();

    console.log(`已添加模型: ${name}`);
    return true;
  }

  /**
   * 更新模型配置
   */
  public updateModel(name: string, updates: Partial<ModelProvider>): boolean {
    if (!this.config.model_providers[name]) {
      console.error(`模型 ${name} 不存在，请使用 addModel 创建`);
      return false;
    }

    // 更新配置
    Object.assign(this.config.model_providers[name], updates);
    this.saveConfig();

    console.log(`已更新模型: ${name}`);
    return true;
  }

  /**
   * 删除模型
   */
  public deleteModel(name: string): boolean {
    if (!this.config.model_providers[name]) {
      console.error(`模型 ${name} 不存在`);
      return false;
    }

    // 检查是否是当前使用的模型
    const currentModel = this.getCurrentModel();
    if (currentModel === name) {
      console.error('无法删除当前使用的模型，请先切换到其他模型');
      return false;
    }

    // 删除模型
    delete this.config.model_providers[name];
    this.saveConfig();

    console.log(`已删除模型: ${name}`);
    return true;
  }

  /**
   * 获取当前模型
   */
  public getCurrentModel(): string {
    const currentInstance = this.config.agent_instances[this.currentModel];
    if (!currentInstance) {
      throw new Error(`代理实例 ${this.currentModel} 不存在`);
    }
    return currentInstance.model;
  }

  /**
   * 获取模型配置
   */
  public getModelConfig(modelName?: string): ModelProvider | undefined {
    const targetModel = modelName || this.getCurrentModel();
    return this.config.model_providers[targetModel];
  }

  /**
   * 重新加载配置
   */
  public reloadConfig(): void {
    this.config = this.loadConfig();
  }
}