#!/usr/bin/env node

import path from 'path';
import { CLI } from './dist/cli/index.js';

async function testCLI() {
  console.log('测试 CLI...');
  
  try {
    const cli = new CLI();
    console.log('CLI 初始化成功');
    
    // 直接调用 start 方法
    await cli.start();
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testCLI();