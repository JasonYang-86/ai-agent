#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
import { AgentManager } from '../core/agent.js';
import { ModelManager } from '../models/modelManager.js';
import { SkillManager } from '../skills/skillManager.js';
import { MemoryManager } from '../memory/memory.js';
import { ToolExecutor } from '../tools/executor.js';
import * as prompts from '@clack/prompts';
import chalk from 'chalk';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();
console.log('环境变量加载成功');
console.log('OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? '已设置' : '未设置');

export class CLI {
  private agentManager: AgentManager;
  private modelManager: ModelManager;
  private skillManager: SkillManager;
  private memoryManager: MemoryManager;
  private toolExecutor: ToolExecutor;
  private program: Command;

  constructor() {
    console.log('正在初始化 Trae-Agent CLI...');
    
    const configPath = path.join(process.cwd(), 'config', 'trae_config.yaml');
    console.log('配置文件路径:', configPath);
    
    this.agentManager = new AgentManager(configPath);
    console.log('AgentManager 初始化成功');
    
    this.modelManager = this.agentManager.getModelManager();
    console.log('ModelManager 初始化成功');
    
    const skillsPath = path.join(process.cwd(), 'skills');
    console.log('技能目录路径:', skillsPath);
    
    this.skillManager = new SkillManager(skillsPath);
    console.log('SkillManager 初始化成功');
    
    this.memoryManager = new MemoryManager();
    console.log('MemoryManager 初始化成功');
    
    this.toolExecutor = new ToolExecutor({ sandbox: true });
    console.log('ToolExecutor 初始化成功');
    
    this.program = new Command();
    this.initialize();
    console.log('CLI 初始化完成');
  }

  /**
   * 初始化 CLI
   */
  private initialize(): void {
    this.program
      .name('trae')
      .description('基于 Trae-Agent 的通用 AI 代理系统')
      .version('1.0.0');

    // 模型管理命令
    this.program
      .command('model')
      .description('模型管理命令')
      .addCommand(this.createModelListCommand())
      .addCommand(this.createModelSwitchCommand())
      .addCommand(this.createModelCurrentCommand())
      .addCommand(this.createModelAddCommand())
      .addCommand(this.createModelUpdateCommand())
      .addCommand(this.createModelDeleteCommand())
      .addCommand(this.createModelSelectCommand());

    // 技能管理命令
    this.program
      .command('skill')
      .description('技能管理命令')
      .addCommand(this.createSkillListCommand())
      .addCommand(this.createSkillExecuteCommand());

    // 记忆管理命令
    this.program
      .command('memory')
      .description('记忆管理命令')
      .addCommand(this.createMemoryClearCommand());

    // 工具执行命令
    this.program
      .command('tool')
      .description('工具执行命令')
      .addCommand(this.createToolExecuteCommand());

    // 帮助命令
    this.program
      .command('help')
      .description('显示帮助信息')
      .action(() => {
        this.program.outputHelp();
      });
  }

  /**
   * 创建模型列表命令
   */
  private createModelListCommand() {
    return new Command('list')
      .description('列出所有可用模型')
      .action(() => {
        console.log(chalk.blue('\n======================================='));
        console.log(chalk.blue('          可用模型列表'));
        console.log(chalk.blue('======================================='));
        
        const models = this.modelManager.listModels();
        const currentModel = this.modelManager.getCurrentModel();
        
        if (models.length === 0) {
          console.log(chalk.yellow('没有可用的模型，请添加模型'));
        } else {
          models.forEach((model: any) => {
            let statusColor = chalk.green;
            let statusText = '可用';
            
            if (model.status === 'service_not_running') {
              statusColor = chalk.yellow;
              statusText = '服务未运行';
            } else if (model.status === 'not_installed') {
              statusColor = chalk.red;
              statusText = '未安装';
            }
            
            const isCurrent = model.name === currentModel;
            const prefix = isCurrent ? chalk.cyan('→ ') : '  ';
            const modelType = model.type === 'cloud' ? chalk.blue('云端') : chalk.green('本地');
            
            console.log(`${prefix}${chalk.bold(model.name)} (${modelType}) - ${statusColor(statusText)}`);
            if (isCurrent) {
              console.log(`    ${chalk.gray('当前使用的模型')}`);
            }
          });
        }
        
        console.log(chalk.blue('======================================='));
      });
  }

  /**
   * 创建模型切换命令
   */
  private createModelSwitchCommand() {
    return new Command('switch')
      .description('切换到指定模型')
      .argument('<model>', '模型名称')
      .action((model) => {
        console.log(chalk.blue(`\n正在切换到模型: ${model}`));
        const success = this.modelManager.switchModel(model);
        if (success) {
          console.log(chalk.green('✓ 模型切换成功'));
          console.log(chalk.blue(`当前使用的模型: ${this.modelManager.getCurrentModel()}`));
        }
      });
  }

  /**
   * 创建模型当前命令
   */
  private createModelCurrentCommand() {
    return new Command('current')
      .description('显示当前模型')
      .action(() => {
        console.log(chalk.blue('\n======================================='));
        console.log(chalk.blue('          当前模型信息'));
        console.log(chalk.blue('======================================='));
        
        const currentModel = this.modelManager.getCurrentModel();
        const modelConfig = this.modelManager.getModelConfig(currentModel);
        
        console.log(`${chalk.bold('模型名称:')} ${chalk.cyan(currentModel)}`);
        if (modelConfig) {
          console.log(`${chalk.bold('模型类型:')} ${modelConfig.type === 'cloud' ? chalk.blue('云端') : chalk.green('本地')}`);
          console.log(`${chalk.bold('基础 URL:')} ${modelConfig.base_url}`);
          if (modelConfig.type === 'cloud') {
            console.log(`${chalk.bold('API Key:')} ${modelConfig.api_key ? chalk.gray('已配置') : chalk.red('未配置')}`);
          } else {
            console.log(`${chalk.bold('模型 ID:')} ${modelConfig.model || '未设置'}`);
          }
        }
        
        console.log(chalk.blue('======================================='));
      });
  }

  /**
   * 创建模型添加命令
   */
  private createModelAddCommand() {
    return new Command('add')
      .description('添加新模型')
      .argument('<name>', '模型名称')
      .action(async (name) => {
        console.log(chalk.blue(`\n=======================================`));
        console.log(chalk.blue(`          添加新模型: ${name}`));
        console.log(chalk.blue(`=======================================`));
        
        const type = await prompts.select({
          message: '选择模型类型',
          options: [
            { value: 'cloud', label: '云端模型' },
            { value: 'local', label: '本地模型' }
          ]
        }) as 'cloud' | 'local';

        const baseUrl = await prompts.text({
          message: '输入模型基础 URL'
        }) as string;

        let apiKey = '';
        if (type === 'cloud') {
          apiKey = await prompts.text({
            message: '输入 API Key (可选)'
          }) as string;
        }

        let modelId = '';
        if (type === 'local') {
          modelId = await prompts.text({
            message: '输入模型 ID (例如: llama3)'
          }) as string || 'llama3';
        }

        const required = type === 'local' ? (await prompts.confirm({
          message: '是否需要 Ollama?'
        }) as boolean) : false;

        console.log(chalk.blue('\n正在添加模型...'));
        const success = this.modelManager.addModel(name, type, baseUrl, apiKey, modelId, required);
        
        if (success) {
          console.log(chalk.green('✓ 模型添加成功'));
          console.log(chalk.blue(`\n模型信息:`));
          console.log(`  ${chalk.bold('名称:')} ${name}`);
          console.log(`  ${chalk.bold('类型:')} ${type === 'cloud' ? '云端' : '本地'}`);
          console.log(`  ${chalk.bold('URL:')} ${baseUrl}`);
          if (type === 'cloud') {
            console.log(`  ${chalk.bold('API Key:')} ${apiKey ? '已配置' : '未配置'}`);
          } else {
            console.log(`  ${chalk.bold('模型 ID:')} ${modelId}`);
            console.log(`  ${chalk.bold('需要 Ollama:')} ${required ? '是' : '否'}`);
          }
        }
        
        console.log(chalk.blue(`=======================================`));
      });
  }

  /**
   * 创建模型更新命令
   */
  private createModelUpdateCommand() {
    return new Command('update')
      .description('更新模型配置')
      .argument('<name>', '模型名称')
      .action(async (name) => {
        console.log(chalk.blue(`\n=======================================`));
        console.log(chalk.blue(`          更新模型: ${name}`));
        console.log(chalk.blue(`=======================================`));
        
        const modelConfig = this.modelManager.getModelConfig(name);
        if (!modelConfig) {
          console.error(chalk.red(`模型 ${name} 不存在`));
          console.log(chalk.blue(`=======================================`));
          return;
        }

        console.log(chalk.blue('当前模型配置:'));
        console.log(`  ${chalk.bold('类型:')} ${modelConfig.type === 'cloud' ? '云端' : '本地'}`);
        console.log(`  ${chalk.bold('基础 URL:')} ${modelConfig.base_url}`);
        if (modelConfig.type === 'cloud') {
          console.log(`  ${chalk.bold('API Key:')} ${modelConfig.api_key ? '已配置' : '未配置'}`);
        } else {
          console.log(`  ${chalk.bold('模型 ID:')} ${modelConfig.model || '未设置'}`);
        }

        console.log(chalk.blue('\n输入新的配置 (留空保持当前):'));

        const baseUrlInput = await prompts.text({
          message: '基础 URL'
        }) as string;
        const baseUrl = baseUrlInput || modelConfig.base_url;

        let apiKey = modelConfig.api_key || '';
        if (modelConfig.type === 'cloud') {
          const apiKeyInput = await prompts.text({
            message: 'API Key'
          }) as string;
          apiKey = apiKeyInput || modelConfig.api_key || '';
        }

        let modelId = modelConfig.model || '';
        if (modelConfig.type === 'local') {
          const modelIdInput = await prompts.text({
            message: '模型 ID'
          }) as string;
          modelId = modelIdInput || modelConfig.model || '';
        }

        const updates: any = {};
        if (baseUrl) updates.base_url = baseUrl;
        if (apiKey) updates.api_key = apiKey;
        if (modelId) updates.model = modelId;

        console.log(chalk.blue('\n正在更新模型...'));
        const success = this.modelManager.updateModel(name, updates);
        
        if (success) {
          console.log(chalk.green('✓ 模型更新成功'));
          console.log(chalk.blue(`\n更新后的配置:`));
          console.log(`  ${chalk.bold('基础 URL:')} ${baseUrl}`);
          if (modelConfig.type === 'cloud') {
            console.log(`  ${chalk.bold('API Key:')} ${apiKey ? '已配置' : '未配置'}`);
          } else {
            console.log(`  ${chalk.bold('模型 ID:')} ${modelId}`);
          }
        }
        
        console.log(chalk.blue(`=======================================`));
      });
  }

  /**
   * 创建模型删除命令
   */
  private createModelDeleteCommand() {
    return new Command('delete')
      .description('删除模型')
      .argument('<name>', '模型名称')
      .action(async (name) => {
        console.log(chalk.blue(`\n=======================================`));
        console.log(chalk.blue(`          删除模型: ${name}`));
        console.log(chalk.blue(`=======================================`));
        
        const modelConfig = this.modelManager.getModelConfig(name);
        if (!modelConfig) {
          console.error(chalk.red(`模型 ${name} 不存在`));
          console.log(chalk.blue(`=======================================`));
          return;
        }

        console.log(chalk.yellow('警告: 删除模型操作不可恢复!'));
        console.log(`  ${chalk.bold('模型名称:')} ${name}`);
        console.log(`  ${chalk.bold('模型类型:')} ${modelConfig.type === 'cloud' ? '云端' : '本地'}`);
        
        const confirm = await prompts.confirm({
          message: `确定要删除模型 ${name} 吗?`
        }) as boolean;
        
        if (!confirm) {
          console.log(chalk.blue('删除操作已取消'));
          console.log(chalk.blue(`=======================================`));
          return;
        }

        console.log(chalk.blue('\n正在删除模型...'));
        const success = this.modelManager.deleteModel(name);
        
        if (success) {
          console.log(chalk.green('✓ 模型删除成功'));
        }
        
        console.log(chalk.blue(`=======================================`));
      });
  }

  /**
   * 创建模型选择命令
   */
  private createModelSelectCommand() {
    return new Command('select')
      .description('交互式模型选择和配置')
      .action(async () => {
        console.log(chalk.blue('\n======================================='));
        console.log(chalk.blue('          模型选择和配置'));
        console.log(chalk.blue('======================================='));
        
        // 预定义模型选项
        const predefinedModels = [
          { value: 'qwen', label: 'Qwen', info: '阿里云通义千问' },
          { value: 'doubao', label: 'Doubao', info: '字节跳动豆包' },
          { value: 'deepseek', label: 'DeepSeek', info: '深度求索' },
          { value: 'gpt', label: 'GPT', info: 'OpenAI GPT' },
          { value: 'custom', label: '自定义模型', info: '手动输入模型信息' }
        ];
        
        // 选择模型类型
        const selectedModel = await prompts.select({
          message: '选择模型',
          options: predefinedModels
        }) as string;
        
        // 模型配置
        let modelName = '';
        let modelId = '';
        let apiKey = '';
        let isLocal = false;
        let localPath = '';
        let baseUrl = '';
        
        // 根据选择的模型设置默认值
        switch (selectedModel) {
          case 'qwen':
            modelName = 'qwen';
            modelId = 'qwen-turbo';
            baseUrl = 'https://dashscope.aliyuncs.com/api/v1';
            break;
          case 'doubao':
            modelName = 'doubao';
            modelId = 'ep-20240413163342-9n8ww';
            baseUrl = 'https://ark.cn-beijing.volces.com/api/v3';
            break;
          case 'deepseek':
            modelName = 'deepseek';
            modelId = 'deepseek-chat';
            baseUrl = 'https://api.deepseek.com/v1';
            break;
          case 'gpt':
            modelName = 'gpt';
            modelId = 'gpt-4';
            baseUrl = 'https://api.openai.com/v1';
            break;
          case 'custom':
            modelName = await prompts.text({
              message: '输入模型名称',
              validate: (value) => value ? undefined : '模型名称不能为空'
            }) as string;
            baseUrl = await prompts.text({
              message: '输入模型基础 URL',
              validate: (value) => value ? undefined : '基础 URL 不能为空'
            }) as string;
            break;
        }
        
        // 模型 ID 输入
        modelId = await prompts.text({
          message: '输入模型 ID',
          initialValue: modelId,
          validate: (value) => value ? undefined : '模型 ID 不能为空'
        }) as string;
        
        // 本地模型切换
        isLocal = await prompts.confirm({
          message: '是否使用本地模型?'
        }) as boolean;
        
        if (isLocal) {
          // 本地模型路径
          localPath = await prompts.text({
            message: '输入本地模型路径',
            initialValue: 'http://localhost:11434/api',
            validate: (value) => value ? undefined : '本地模型路径不能为空'
          }) as string;
          baseUrl = localPath;
        } else {
          // API Key 输入
          apiKey = await prompts.text({
            message: '输入 API Key',
            validate: (value) => value ? undefined : 'API Key 不能为空'
          }) as string;
        }
        
        // 显示配置摘要
        console.log(chalk.blue('\n======================================='));
        console.log(chalk.blue('          模型配置摘要'));
        console.log(chalk.blue('======================================='));
        console.log(`  ${chalk.bold('模型名称:')} ${modelName}`);
        console.log(`  ${chalk.bold('模型 ID:')} ${modelId}`);
        console.log(`  ${chalk.bold('基础 URL:')} ${baseUrl}`);
        console.log(`  ${chalk.bold('模型类型:')} ${isLocal ? '本地' : '云端'}`);
        if (!isLocal) {
          console.log(`  ${chalk.bold('API Key:')} ${apiKey ? '已配置' : '未配置'}`);
        }
        
        // 确认保存
        const confirm = await prompts.confirm({
          message: '确定要保存这个模型配置吗?'
        }) as boolean;
        
        if (confirm) {
          // 保存模型配置
          const success = this.modelManager.addModel(
            modelName,
            isLocal ? 'local' : 'cloud',
            baseUrl,
            apiKey,
            modelId,
            isLocal
          );
          
          if (success) {
            console.log(chalk.green('\n✓ 模型配置保存成功'));
            
            // 询问是否设置为默认模型
            const setDefault = await prompts.confirm({
              message: '是否将此模型设置为默认模型?'
            }) as boolean;
            
            if (setDefault) {
              this.modelManager.switchModel(modelName);
              console.log(chalk.green('✓ 已设置为默认模型'));
            }
          }
        } else {
          console.log(chalk.blue('\n配置已取消'));
        }
        
        console.log(chalk.blue('======================================='));
      });
  }

  /**
   * 创建技能列表命令
   */
  private createSkillListCommand() {
    return new Command('list')
      .description('列出所有可用技能')
      .action(() => {
        const skills = this.skillManager.listSkills();
        console.log(chalk.blue('可用技能:'));
        skills.forEach((skill: string) => {
          console.log(`- ${skill}`);
        });
      });
  }

  /**
   * 创建技能执行命令
   */
  private createSkillExecuteCommand() {
    return new Command('execute')
      .description('执行技能')
      .argument('<skill>', '技能名称')
      .action(async (skill) => {
        const skillInfo = this.skillManager.getSkillInfo(skill);
        if (!skillInfo) {
          console.error(chalk.red(`技能 ${skill} 不存在`));
          return;
        }

        const params: any = {};
        for (const [name, paramConfig] of Object.entries(skillInfo.parameters) as [string, { description: string; required: boolean }][]) {
          const value = await prompts.text({
            message: `输入参数 ${name} (${paramConfig.description})${paramConfig.required ? ' *' : ''}`
          }) as string;
          
          if (paramConfig.required && !value) {
            console.error(chalk.red(`参数 ${name} 是必填项`));
            return;
          }
          params[name] = value;
        }

        const result = await this.skillManager.executeSkill(skill, params);
        console.log(chalk.green(result));
      });
  }

  /**
   * 创建记忆清除命令
   */
  private createMemoryClearCommand() {
    return new Command('clear')
      .description('清空记忆')
      .action(() => {
        this.memoryManager.clearChatHistory();
        this.memoryManager.clearTasks();
        console.log(chalk.green('记忆已清空'));
      });
  }

  /**
   * 创建工具执行命令
   */
  private createToolExecuteCommand() {
    return new Command('execute')
      .description('执行工具命令')
      .argument('<command>', '要执行的命令')
      .action(async (command) => {
        const result = await this.toolExecutor.executeBash(command);
        console.log(chalk.green(result));
      });
  }

  /**
   * 启动 CLI
   */
  public async start() {
    console.log('当前工作目录:', process.cwd());
    console.log('命令行参数:', process.argv);
    console.log(chalk.blue('欢迎使用 Trae-Agent CLI'));
    console.log(chalk.blue('输入命令或直接输入任务描述，输入 exit 退出'));

    // 解析命令行参数
    if (process.argv.length > 2) {
      console.log('检测到命令行参数，开始解析...');
      try {
        console.log('准备解析命令:', process.argv.slice(2));
        this.program.parse(process.argv);
        console.log('命令解析完成');
      } catch (error) {
        console.error(chalk.red('解析命令失败:'), error);
      }
      console.log('命令执行完成，退出程序');
      return;
    }

    // 交互式命令行
    while (true) {
      const input = await prompts.text({
        message: '>>>'
      });

      // 检查输入是否为字符串
      if (typeof input !== 'string') {
        console.log(chalk.red('输入无效，请重新输入'));
        continue;
      }

      if (input === 'exit') {
        break;
      } else if (input === 'help') {
        this.program.outputHelp();
      } else if (input.startsWith('model ')) {
        // 解析模型命令
        const parts = input.split(' ');
        if (parts.length >= 2) {
          const subcommand = parts[1];
          const args = parts.slice(2);
          await this.program.parseAsync(['node', 'trae', 'model', subcommand, ...args]);
        }
      } else if (input.startsWith('skill ')) {
        // 解析技能命令
        const parts = input.split(' ');
        if (parts.length >= 2) {
          const subcommand = parts[1];
          const args = parts.slice(2);
          await this.program.parseAsync(['node', 'trae', 'skill', subcommand, ...args]);
        }
      } else if (input.startsWith('memory ')) {
        // 解析记忆命令
        const parts = input.split(' ');
        if (parts.length >= 2) {
          const subcommand = parts[1];
          await this.program.parseAsync(['node', 'trae', 'memory', subcommand]);
        }
      } else if (input.startsWith('tool ')) {
        // 解析工具命令
        const parts = input.split(' ');
        if (parts.length >= 2) {
          const command = parts.slice(1).join(' ');
          const result = await this.toolExecutor.executeBash(command);
          console.log(chalk.green(result));
        }
      } else {
        // 执行 AI 任务
        console.log(chalk.blue('正在处理任务...'));
        try {
          const result = await this.agentManager.run(input);
          console.log(chalk.green('AI 响应:'));
          console.log(result);
        } catch (error) {
          console.error(chalk.red('处理任务失败:'), error);
        }
      }
    }

    console.log(chalk.blue('再见!'));
  }
}

// 启动 CLI
const isDirectExecution = process.argv[1].includes('cli/index.js') || process.argv[1].includes('cli\\index.js');
if (isDirectExecution) {
  const cli = new CLI();
  cli.start();
}