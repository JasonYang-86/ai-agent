import fs from 'fs';
import path from 'path';
import { SkillParams, SkillConfig } from '../core/types';

export class SkillManager {
  private skillsDir: string;
  private skills: Record<string, SkillConfig> = {};

  constructor(skillsDir: string) {
    this.skillsDir = skillsDir;
    this.loadSkills();
  }

  /**
   * 加载技能包
   */
  private loadSkills(): void {
    if (!fs.existsSync(this.skillsDir)) {
      fs.mkdirSync(this.skillsDir, { recursive: true });
      return;
    }

    const files = fs.readdirSync(this.skillsDir);
    for (const file of files) {
      if (file.endsWith('.md')) {
        const skillPath = path.join(this.skillsDir, file);
        const skillName = file.substring(0, file.lastIndexOf('.'));
        try {
          const content = fs.readFileSync(skillPath, 'utf-8');
          const skillConfig = this.parseSkillFile(content);
          this.skills[skillName] = skillConfig;
        } catch (error) {
          console.error(`加载技能 ${skillName} 失败:`, error);
        }
      }
    }
  }

  /**
   * 解析技能文件
   */
  private parseSkillFile(content: string): SkillConfig {
    // 简单解析 SKILL.md 格式
    // 实际实现可能需要更复杂的解析逻辑
    const lines = content.split('\n');
    let skillConfig: Partial<SkillConfig> = {
      name: '',
      description: '',
      parameters: {},
      steps: []
    };

    let currentSection = '';
    for (const line of lines) {
      if (line.startsWith('# ')) {
        currentSection = line.substring(2).trim().toLowerCase();
      } else if (currentSection === 'name') {
        skillConfig.name = line.trim();
      } else if (currentSection === 'description') {
        skillConfig.description = line.trim();
      } else if (currentSection === 'parameters') {
        // 解析参数
        if (line.trim() && !line.startsWith('- ')) {
          const [name, rest] = line.split(':');
          if (name && rest) {
            const [type, required, ...descParts] = rest.split(' ');
            skillConfig.parameters![name.trim()] = {
              type: type.trim(),
              required: required.trim() === 'required',
              description: descParts.join(' ').trim()
            };
          }
        }
      } else if (currentSection === 'steps') {
        if (line.trim() && line.startsWith('- ')) {
          skillConfig.steps!.push(line.substring(2).trim());
        }
      }
    }

    return skillConfig as SkillConfig;
  }

  /**
   * 执行技能
   */
  public async executeSkill(skillName: string, params: SkillParams = {}): Promise<string> {
    if (!this.skills[skillName]) {
      return `技能 ${skillName} 不存在`;
    }

    const skill = this.skills[skillName];

    // 验证参数
    for (const [name, paramConfig] of Object.entries(skill.parameters)) {
      if (paramConfig.required && !params[name]) {
        return `缺少必要参数: ${name}`;
      }
    }

    // 执行技能步骤
    let result = `执行技能 ${skillName} 开始\n`;
    for (const step of skill.steps) {
      // 替换参数占位符
      let stepWithParams = step;
      for (const [name, value] of Object.entries(params)) {
        stepWithParams = stepWithParams.replace(`{{${name}}}`, String(value));
      }

      result += `- ${stepWithParams}\n`;

      // 这里可以添加实际的步骤执行逻辑
      // 例如执行命令、调用 API 等
    }

    result += `执行技能 ${skillName} 完成`;
    return result;
  }

  /**
   * 列出所有技能
   */
  public listSkills(): string[] {
    return Object.keys(this.skills);
  }

  /**
   * 获取技能信息
   */
  public getSkillInfo(skillName: string): SkillConfig | undefined {
    return this.skills[skillName];
  }

  /**
   * 添加技能
   */
  public addSkill(skillName: string, content: string): boolean {
    const skillPath = path.join(this.skillsDir, `${skillName}.md`);
    try {
      fs.writeFileSync(skillPath, content, 'utf-8');
      // 重新加载技能
      this.loadSkills();
      return true;
    } catch (error) {
      console.error(`添加技能 ${skillName} 失败:`, error);
      return false;
    }
  }

  /**
   * 删除技能
   */
  public deleteSkill(skillName: string): boolean {
    const skillPath = path.join(this.skillsDir, `${skillName}.md`);
    if (!fs.existsSync(skillPath)) {
      return false;
    }

    try {
      fs.unlinkSync(skillPath);
      // 重新加载技能
      this.loadSkills();
      return true;
    } catch (error) {
      console.error(`删除技能 ${skillName} 失败:`, error);
      return false;
    }
  }

  /**
   * 重新加载技能
   */
  public reloadSkills(): void {
    this.loadSkills();
  }
}