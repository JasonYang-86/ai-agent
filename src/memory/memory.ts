import fs from 'fs';
import path from 'path';
import { ChatHistory, TaskStatus } from '../core/types';

export class MemoryManager {
  private memoryDir: string;
  private chatHistory: ChatHistory[] = [];
  private tasks: TaskStatus[] = [];

  constructor(memoryDir: string = path.join(process.cwd(), '.memory')) {
    this.memoryDir = memoryDir;
    this.initialize();
    this.loadMemory();
  }

  /**
   * 初始化内存目录
   */
  private initialize(): void {
    if (!fs.existsSync(this.memoryDir)) {
      fs.mkdirSync(this.memoryDir, { recursive: true });
    }
  }

  /**
   * 加载内存数据
   */
  private loadMemory(): void {
    // 加载对话历史
    const chatHistoryPath = path.join(this.memoryDir, 'chat_history.json');
    if (fs.existsSync(chatHistoryPath)) {
      try {
        const content = fs.readFileSync(chatHistoryPath, 'utf-8');
        this.chatHistory = JSON.parse(content);
      } catch (error) {
        console.error('加载对话历史失败:', error);
        this.chatHistory = [];
      }
    }

    // 加载任务状态
    const tasksPath = path.join(this.memoryDir, 'tasks.json');
    if (fs.existsSync(tasksPath)) {
      try {
        const content = fs.readFileSync(tasksPath, 'utf-8');
        this.tasks = JSON.parse(content);
      } catch (error) {
        console.error('加载任务状态失败:', error);
        this.tasks = [];
      }
    }
  }

  /**
   * 保存内存数据
   */
  private saveMemory(): void {
    // 保存对话历史
    const chatHistoryPath = path.join(this.memoryDir, 'chat_history.json');
    try {
      fs.writeFileSync(chatHistoryPath, JSON.stringify(this.chatHistory, null, 2), 'utf-8');
    } catch (error) {
      console.error('保存对话历史失败:', error);
    }

    // 保存任务状态
    const tasksPath = path.join(this.memoryDir, 'tasks.json');
    try {
      fs.writeFileSync(tasksPath, JSON.stringify(this.tasks, null, 2), 'utf-8');
    } catch (error) {
      console.error('保存任务状态失败:', error);
    }
  }

  /**
   * 添加对话历史
   */
  public addChatHistory(history: ChatHistory): void {
    this.chatHistory.push(history);
    // 限制对话历史长度
    if (this.chatHistory.length > 100) {
      this.chatHistory = this.chatHistory.slice(-100);
    }
    this.saveMemory();
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
    this.saveMemory();
  }

  /**
   * 创建任务
   */
  public createTask(description: string): TaskStatus {
    const task: TaskStatus = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      description,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.tasks.push(task);
    this.saveMemory();
    return task;
  }

  /**
   * 更新任务状态
   */
  public updateTask(id: string, updates: Partial<TaskStatus>): TaskStatus | undefined {
    const taskIndex = this.tasks.findIndex(task => task.id === id);
    if (taskIndex === -1) {
      return undefined;
    }

    this.tasks[taskIndex] = {
      ...this.tasks[taskIndex],
      ...updates,
      updatedAt: Date.now()
    };

    this.saveMemory();
    return this.tasks[taskIndex];
  }

  /**
   * 获取任务
   */
  public getTask(id: string): TaskStatus | undefined {
    return this.tasks.find(task => task.id === id);
  }

  /**
   * 列出所有任务
   */
  public listTasks(): TaskStatus[] {
    return this.tasks;
  }

  /**
   * 删除任务
   */
  public deleteTask(id: string): boolean {
    const initialLength = this.tasks.length;
    this.tasks = this.tasks.filter(task => task.id !== id);
    if (this.tasks.length !== initialLength) {
      this.saveMemory();
      return true;
    }
    return false;
  }

  /**
   * 清空所有任务
   */
  public clearTasks(): void {
    this.tasks = [];
    this.saveMemory();
  }

  /**
   * 搜索对话历史
   */
  public searchChatHistory(query: string): ChatHistory[] {
    return this.chatHistory.filter(history => 
      history.content.toLowerCase().includes(query.toLowerCase())
    );
  }

  /**
   * 搜索任务
   */
  public searchTasks(query: string): TaskStatus[] {
    return this.tasks.filter(task => 
      task.description.toLowerCase().includes(query.toLowerCase())
    );
  }
}