import fs from 'fs';
import { execSync, spawn } from 'child_process';
import { ToolExecutorOptions } from '../core/types';

export class ToolExecutor {
  private sandbox: boolean;

  constructor(options: ToolExecutorOptions) {
    this.sandbox = options.sandbox;
  }

  /**
   * 执行 Bash 命令
   */
  public async executeBash(command: string): Promise<string> {
    if (this.sandbox) {
      return this.executeInSandbox(command);
    } else {
      return this.executeDirectly(command);
    }
  }

  /**
   * 直接执行命令
   */
  private executeDirectly(command: string): string {
    try {
      const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
      return output;
    } catch (error: any) {
      return `执行命令失败: ${error.message}\n${error.stdout || ''}\n${error.stderr || ''}`;
    }
  }

  /**
   * 在沙箱中执行命令
   */
  private async executeInSandbox(command: string): Promise<string> {
    try {
      // 检查 Docker 是否安装
      execSync('docker --version', { stdio: 'ignore' });

      // 构建 Docker 命令
      const dockerCommand = `docker run --rm alpine:latest sh -c "${command.replace(/"/g, '\\"')}"`;
      const output = execSync(dockerCommand, { encoding: 'utf-8', stdio: 'pipe' });
      return output;
    } catch (error: any) {
      return `在沙箱中执行命令失败: ${error.message}\n${error.stdout || ''}\n${error.stderr || ''}`;
    }
  }

  /**
   * 编辑文件
   */
  public async editFile(filePath: string, content: string): Promise<string> {
    try {
      // 确保目录存在
      const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
      if (dirPath) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      // 写入文件
      fs.writeFileSync(filePath, content, 'utf-8');
      return `文件 ${filePath} 更新成功`;
    } catch (error: any) {
      return `编辑文件失败: ${error.message}`;
    }
  }

  /**
   * 读取文件
   */
  public async readFile(filePath: string): Promise<string> {
    try {
      if (!fs.existsSync(filePath)) {
        return `文件不存在: ${filePath}`;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      return content;
    } catch (error: any) {
      return `读取文件失败: ${error.message}`;
    }
  }

  /**
   * 发送 HTTP 请求
   */
  public async sendHttpRequest(url: string, options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {}): Promise<string> {
    try {
      const axios = require('axios');
      const response = await axios({
        url,
        method: options.method || 'GET',
        headers: options.headers,
        data: options.body,
        timeout: 30000
      });

      return JSON.stringify(response.data, null, 2);
    } catch (error: any) {
      return `发送 HTTP 请求失败: ${error.message}`;
    }
  }

  /**
   * 列出目录内容
   */
  public async listDirectory(path: string): Promise<string> {
    try {
      if (!fs.existsSync(path)) {
        return `目录不存在: ${path}`;
      }

      const files = fs.readdirSync(path);
      return files.join('\n');
    } catch (error: any) {
      return `列出目录失败: ${error.message}`;
    }
  }

  /**
   * 创建目录
   */
  public async createDirectory(path: string): Promise<string> {
    try {
      fs.mkdirSync(path, { recursive: true });
      return `目录 ${path} 创建成功`;
    } catch (error: any) {
      return `创建目录失败: ${error.message}`;
    }
  }

  /**
   * 删除文件或目录
   */
  public async deleteFile(path: string): Promise<string> {
    try {
      if (!fs.existsSync(path)) {
        return `文件或目录不存在: ${path}`;
      }

      const stats = fs.statSync(path);
      if (stats.isDirectory()) {
        fs.rmSync(path, { recursive: true, force: true });
      } else {
        fs.unlinkSync(path);
      }

      return `文件或目录 ${path} 删除成功`;
    } catch (error: any) {
      return `删除文件或目录失败: ${error.message}`;
    }
  }
}