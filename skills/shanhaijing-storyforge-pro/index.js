'use strict';

/**
 * 山海经故事引擎 Pro — Stormaxe Skill Wrapper
 * 原始模块: orchestrator.js
 */

const path = require('path');
const { SkillBase } = require('../skill-base');

const STORM_ROOT = path.join(__dirname, '..', '..', '..', 'StormaxeAIVideoSystem', 'skills', 'shanhaijing-storyforge-pro');

class StoryForgeProOrchestratorSkill extends SkillBase {
  constructor(options = {}) {
    super({
      name: 'shanhaijing-storyforge-pro',
      version: '1.0.0',
      description: '故事创作引擎（原创/IP重构/系列三种模式）',
      category: 'stormaxe',
      ...options
    });
    this.stormInstance = null;
  }

  async onInitialize(context) {
    try {
      const StormModule = require(path.join(STORM_ROOT, 'orchestrator.js'));
      
      // 处理不同的导出格式
      let StormClass = StormModule;
      if (StormModule.StoryForgeProOrchestrator) {
        StormClass = StormModule.StoryForgeProOrchestrator;
      } else if (typeof StormModule === 'object' && !StormModule.prototype) {
        // 如果导出的不是类，尝试找到第一个类
        const keys = Object.keys(StormModule);
        for (const key of keys) {
          if (typeof StormModule[key] === 'function' && StormModule[key].prototype) {
            StormClass = StormModule[key];
            break;
          }
        }
      }
      
      // 如果导出的不是类，检查是否是函数（CLI 脚本）
      if (typeof StormClass === 'function' && !StormClass.prototype) {
        this.stormInstance = { run: StormClass };
        console.log(`[shanhaijing-storyforge-pro] ✅ 原始模块加载成功（函数模式）`);
        return true;
      }
      
      // 如果导出为空对象或不是构造函数，使用降级
      if (typeof StormClass !== 'function' || (!StormClass.prototype && StormClass.name === '')) {
        console.log(`[shanhaijing-storyforge-pro] ℹ️ 原始模块无导出，使用降级模式`);
        this.stormInstance = this._createMockInstance();
        return true;
      }
      
      this.stormInstance = new StormClass();
      console.log(`[shanhaijing-storyforge-pro] ✅ 原始模块加载成功`);
      return true;
    } catch (e) {
      console.warn(`[shanhaijing-storyforge-pro] ⚠️ 原始模块加载失败: ${e.message}`);
      // 降级：创建 mock 实例
      this.stormInstance = this._createMockInstance();
      return true;
    }
  }

  async onExecute(input, context) {
    const traceId = (context && context.traceId) || `pro_${Date.now()}`;
    
    if (!this.stormInstance) {
      throw new Error('shanhaijing-storyforge-pro: 原始模块未初始化');
    }

    // 透传输入，让原始模块自行处理
    // 暴风战斧 Skill 的接口各不相同，这里采用通用透传策略
    const result = { _skillId: 'shanhaijing-storyforge-pro', _timestamp: Date.now() };
    
    // 尝试调用原始模块的方法（如果存在）
    const methodCandidates = [
      'execute', 'process', 'generate', 'evaluate', 'forge', 'analyze',
      'render', 'direct', 'integrate', 'create'
    ];
    
    let executed = false;
    for (const method of methodCandidates) {
      if (typeof this.stormInstance[method] === 'function') {
        try {
          const output = await this.stormInstance[method](input);
          Object.assign(result, output);
          executed = true;
          break;
        } catch (e) {
          // 尝试下一个方法
        }
      }
    }
    
    if (!executed) {
      // 如果没有匹配的方法，返回原始输入 + 标记
      result._input = input;
      result._note = '原始模块方法未匹配，采用透传模式';
    }
    
    return result;
  }

  _createMockInstance() {
    return {
      execute: async (input) => ({ _mock: true, _input: input }),
      process: async (input) => ({ _mock: true, _input: input })
    };
  }
}

module.exports = { StoryForgeProOrchestratorSkill };
