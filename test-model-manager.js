#!/usr/bin/env node

import path from 'path';
import { ModelManager } from './dist/models/modelManager.js';

async function testModelManager() {
  console.log('测试 ModelManager...');
  
  try {
    const configPath = path.join(process.cwd(), 'config', 'trae_config.yaml');
    console.log('配置文件路径:', configPath);
    
    const modelManager = new ModelManager(configPath);
    console.log('ModelManager 初始化成功');
    
    const models = modelManager.listModels();
    console.log('可用模型:', models);
    
    const currentModel = modelManager.getCurrentModel();
    console.log('当前模型:', currentModel);
    
    console.log('测试成功！');
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testModelManager();