import fs from 'fs';
import yaml from 'yaml';
import axios from 'axios';
import dotenv from 'dotenv';
import { ModelConfig, ChatHistory } from './types';
import { ModelManager } from '../models/modelManager.js';

// 加载环境变量
dotenv.config();

export class AgentManager {
  private configPath: string;
  private config: ModelConfig;
  private modelManager: ModelManager;
  private chatHistory: ChatHistory[] = [];

  constructor(configPath: string) {
    this.configPath = configPath;
    this.config = this.loadConfig();
    this.modelManager = new ModelManager(configPath);
  }

  /**
   * 加载配置文件
   */
  private loadConfig(): ModelConfig {
    if (!fs.existsSync(this.configPath)) {
      throw new Error(`配置文件不存在: ${this.configPath}`);
    }

    const content = fs.readFileSync(this.configPath, 'utf-8');
    return yaml.parse(content) as ModelConfig;
  }

  /**
   * 检测文本语言
   */
  private detectLanguage(text: string): string {
    // 简单的语言检测逻辑
    // 检查是否包含中文字符
    const hasChinese = /[\u4e00-\u9fa5]/.test(text);
    return hasChinese ? '中文' : '英文';
  }

  /**
   * 清理响应内容，移除重复部分和乱码
   */
  private cleanResponse(response: string): string {
    // 移除重复的内容
    const cleaned = response.replace(/\((as in "[^\)]+")\)/g, '');
    
    // 移除连续重复的字符（支持中文）
    const cleaned2 = cleaned.replace(/(.)\1{3,}/g, '$1');
    
    // 移除多余的空白字符
    const cleaned3 = cleaned2.replace(/\s+/g, ' ').trim();
    
    // 修复常见的中文乱码模式
    const cleaned4 = cleaned3.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
    
    // 限制响应长度，避免过长
    if (cleaned4.length > 1500) {
      return cleaned4.substring(0, 1500) + '...';
    }
    
    return cleaned4;
  }

  /**
   * 运行 Agent
   */
  public async run(prompt: string): Promise<string> {
    // 检测用户语言
    const userLanguage = this.detectLanguage(prompt);
    console.log(`检测到用户语言: ${userLanguage}`);
    
    // 添加用户输入到对话历史
    this.chatHistory.push({
      role: 'user',
      content: prompt,
      timestamp: Date.now()
    });

    // 获取当前模型配置
    const currentModel = this.modelManager.getCurrentModel();
    const modelConfig = this.modelManager.getModelConfig(currentModel);

    if (!modelConfig) {
      throw new Error(`模型配置不存在: ${currentModel}`);
    }

    // 添加语言指令，确保模型用相同语言回答
    const languageInstruction = userLanguage === '中文' 
      ? '请使用中文回答这个问题' 
      : 'Please answer this question in English';
    
    const enhancedPrompt = `${languageInstruction}\n\n${prompt}`;

    // 模拟模型调用
    let response: string;
    if (modelConfig.type === 'local') {
      response = await this.callLocalModel(enhancedPrompt, modelConfig);
    } else {
      response = await this.callCloudModel(enhancedPrompt, modelConfig);
    }

    // 清理响应内容
    const cleanedResponse = this.cleanResponse(response);

    // 添加模型响应到对话历史
    this.chatHistory.push({
      role: 'assistant',
      content: cleanedResponse,
      timestamp: Date.now()
    });

    return cleanedResponse;
  }

  /**
   * 调用本地模型
   */
  private async callLocalModel(prompt: string, modelConfig: any): Promise<string> {
    try {
      const response = await axios.post(`${modelConfig.base_url}/generate`, {
        model: modelConfig.model || 'llama3',
        prompt,
        stream: false
      });

      return response.data.response || '本地模型未返回响应';
    } catch (error) {
      console.error('调用本地模型失败:', error);
      return '调用本地模型失败，请检查 Ollama 服务是否运行';
    }
  }

  /**
   * 调用云端模型
   */
  private async callCloudModel(prompt: string, modelConfig: any): Promise<string> {
    try {
      const response = await axios.post(`${modelConfig.base_url}/chat/completions`, {
        model: modelConfig.model || 'gpt-4',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,  // 增加最大token数，支持更长的文章
        top_p: 0.9,        // 调整top_p参数
        frequency_penalty: 0.1,  // 添加频率惩罚，减少重复
        presence_penalty: 0.1     // 添加存在惩罚，鼓励多样性
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${modelConfig.api_key}`
        }
      });

      // 确保响应使用正确的编码
      const content = response.data.choices[0].message.content;
      const decodedContent = Buffer.from(content, 'utf-8').toString('utf-8');
      return decodedContent || '云端模型未返回响应';
    } catch (error) {
      console.error('调用云端模型失败:', error);
      return '调用云端模型失败，请检查 API Key 是否正确';
    }
  }

  /**
   * 获取对话历史
   */
  public getChatHistory(): ChatHistory[] {
    return this.chatHistory;
  }

  /**
   * 清空对话历史
   */
  public clearChatHistory(): void {
    this.chatHistory = [];
  }

  /**
   * 获取模型管理器
   */
  public getModelManager(): ModelManager {
    return this.modelManager;
  }

  /**
   * 重新加载配置
   */
  public reloadConfig(): void {
    this.config = this.loadConfig();
    this.modelManager.reloadConfig();
  }
}