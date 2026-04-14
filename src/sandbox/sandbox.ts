import Docker from 'dockerode';
import { SandboxOptions } from '../core/types';

class SandboxManager {
  private docker: Docker;

  constructor() {
    this.docker = new Docker();
  }

  /**
   * 创建沙箱容器
   */
  public async createSandbox(options: SandboxOptions = {}): Promise<string> {
    try {
      const container = await this.docker.createContainer({
        Image: options.image || 'alpine:latest',
        Tty: true,
        Volumes: options.volumes,
        HostConfig: {
          VolumesFrom: [],
          NetworkMode: options.networkMode || 'bridge'
        }
      }) as any;

      await container.start();
      return container.id;
    } catch (error: any) {
      throw new Error(`创建沙箱失败: ${error.message}`);
    }
  }

  /**
   * 在沙箱中执行命令
   */
  public async executeInSandbox(containerId: string, command: string): Promise<string> {
    try {
      const container = this.docker.getContainer(containerId);
      const exec = await container.exec({
        Cmd: ['sh', '-c', command],
        AttachStdout: true,
        AttachStderr: true
      });

      const stream = await exec.start({ hijack: true, stdin: true });
      
      return new Promise((resolve, reject) => {
        let output = '';
        stream.on('data', (data: Buffer) => {
          output += data.toString();
        });
        stream.on('end', () => {
          resolve(output);
        });
        stream.on('error', (error: any) => {
          reject(new Error(`执行命令失败: ${error.message}`));
        });
      });
    } catch (error: any) {
      throw new Error(`在沙箱中执行命令失败: ${error.message}`);
    }
  }

  /**
   * 销毁沙箱容器
   */
  public async destroySandbox(containerId: string): Promise<void> {
    try {
      const container = this.docker.getContainer(containerId);
      await container.stop();
      await container.remove();
    } catch (error: any) {
      throw new Error(`销毁沙箱失败: ${error.message}`);
    }
  }

  /**
   * 列出所有沙箱容器
   */
  public async listSandboxes(): Promise<any[]> {
    try {
      const containers = await this.docker.listContainers({
        all: true,
        filters: {
          ancestor: ['alpine:latest']
        }
      });
      return containers;
    } catch (error: any) {
      throw new Error(`列出沙箱失败: ${error.message}`);
    }
  }

  /**
   * 检查沙箱状态
   */
  public async getSandboxStatus(containerId: string): Promise<string> {
    try {
      const container = this.docker.getContainer(containerId);
      const info = await container.inspect();
      return info.State.Status;
    } catch (error: any) {
      throw new Error(`获取沙箱状态失败: ${error.message}`);
    }
  }

  /**
   * 检查 Docker 是否可用
   */
  public async isDockerAvailable(): Promise<boolean> {
    try {
      await this.docker.ping();
      return true;
    } catch {
      return false;
    }
  }
}