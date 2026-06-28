/**
 * Saga-Skill Fusion Orchestrator v1.0
 * short-video/core/saga-skill-fusion.js
 *
 * 职责：将卓越/暴风战斧的 Skill 动态注入超短裙 Saga 编排器
 * 设计原则：
 * - 不修改超短裙原生 17 Stage 定义
 * - Skill 作为动态 Stage (STAGE-18+) 注入
 * - 使用超短裙原生 NirathEventBus（保留可观测性优势）
 * - 直接调用 Skill.execute()，不依赖卓越的 SkillOrchestratorAdapter
 *
 * @version v1.0
 * @author 协同进化引擎
 */

'use strict';

const path = require('path');
const { SkillLoader } = require('../skills/skill-loader');
const { SkillRegistry } = require('../skills/skill-registry');
const { NirathEventBus } = require('../core/event-bus');

// ============================================================
// 融合预设：超短裙原生字段 → 卓越/暴风 Skill 字段映射
// ============================================================

const FUSION_CONTEXT_PRESETS = {
  // 超短裙 → 卓越 commercial-mode
  'short-video-to-commercial': {
    'product.name': 'product.name',
    'product.type': 'product.type',
    'brand.name': 'brand',
    'targetAudience': 'targetAudience',
    'duration': 'duration',
    'cameraPlan.shots': 'shots'
  },
  // 卓越 cinematic-camera → 超短裙 adventure-cinematography
  'camera-to-adventure': {
    'cameraPlan': 'cameraPlan',
    'lightingSetup': 'lighting',
    'cameraMovement': 'motion',
    'shotDuration': 'duration'
  },
  // 暴风 storyforge-pro → 超短裙 saga
  'storyforge-to-saga': {
    'script': 'script',
    'scenes': 'scenes',
    'characters': 'characters',
    'worldBuilding': 'world'
  }
};

// ============================================================
// Fusion Orchestrator
// ============================================================

class SagaSkillFusionOrchestrator {
  constructor(options = {}) {
    this.skillsDir = options.skillsDir || path.join(__dirname, '..', 'skills');
    
    // 支持外部传入 eventBus（避免重复创建和事件重复）
    if (options.eventBus) {
      this.eventBus = options.eventBus;
      this._externalEventBus = true;  // 标记为外部传入，shutdown 时不关闭
    } else {
      this.eventBus = new NirathEventBus({ name: 'fusion-bus' });
      this._externalEventBus = false;
    }
    
    // Skill 系统
    this.loader = new SkillLoader({ skillDirs: [this.skillsDir] });
    this.registry = new SkillRegistry();
    
    // 动态 Stage 定义
    this.dynamicStageDefinitions = {};
    this.skillInstances = new Map(); // skillId -> instance
    
    this.initialized = false;
  }

  /**
   * 初始化：扫描、加载、注册、实例化所有 Skill
   */
  async initialize() {
    if (this.initialized) return;
    
    console.log('[Fusion] 🚀 初始化 Saga-Skill 融合编排器...');
    
    // 1. 扫描 Skill 目录
    const discovered = this.loader.scan();
    const loadResult = this.loader.loadAll();
    const loadedSkills = loadResult.loaded || [];
    console.log(`[Fusion] 📂 发现 ${discovered.length} 个 Skill 目录 | 成功加载 ${loadedSkills.length} 个`);
    
    // 2. 注册到 Registry 并实例化
    for (const skill of loadedSkills) {
      this.registry.register(skill);
      
      // skill 已经是实例（SkillLoader.loadAll 返回的是实例数组）
      try {
        // 初始化 Skill（如果尚未初始化）
        if (typeof skill.initialize === 'function' && skill.status === 'PENDING') {
          await skill.initialize({ eventBus: this.eventBus });
        }
        
        this.skillInstances.set(skill.id, skill);
        console.log(`[Fusion] ✅ 注册并初始化 Skill: ${skill.id}`);
      } catch (e) {
        console.error(`[Fusion] ❌ Skill 初始化失败: ${skill.id} | ${e.message}`);
      }
    }
    
    // 3. 将 Skill 映射为动态 Stage 定义
    this._buildDynamicStageDefinitions();
    
    this.initialized = true;
    console.log(`[Fusion] 🟢 初始化完成 | ${this.skillInstances.size} 个 Skill 就绪`);
  }

  /**
   * 将已实例化的 Skill 映射为 Saga Stage 定义
   */
  _buildDynamicStageDefinitions() {
    let stageIndex = 18;
    
    for (const [skillId, instance] of this.skillInstances) {
      const config = instance.config || {};
      const stageId = `STAGE-FUSION-${stageIndex}`;
      
      this.dynamicStageDefinitions[stageId] = {
        id: stageId,
        name: config.name || skillId,
        phase: this._inferPhase(skillId, config),
        blocking: config.blocking !== false,
        required: config.required !== false,
        timeoutMs: config.timeoutMs || 30000,
        retryPolicy: config.retryPolicy || { maxAttempts: 1, backoffMs: 1000 },
        fallback: { strategy: config.fallback || 'skip' },
        compensate: null,
        _skillId: skillId
      };
      
      stageIndex++;
    }
    
    console.log(`[Fusion] 📝 动态 Stage 定义: ${Object.keys(this.dynamicStageDefinitions).length} 个`);
  }

  /**
   * 推断 Skill 所属阶段
   */
  _inferPhase(skillId, config) {
    if (config.phase) return config.phase;
    
    const id = skillId.toLowerCase();
    if (id.includes('script') || id.includes('story') || id.includes('prd') || 
        id.includes('commercial') || id.includes('prompt') || id.includes('guardian')) return 'pre_production';
    if (id.includes('camera') || id.includes('shot') || id.includes('cinematography') || 
        id.includes('continuity')) return 'pre_production';
    if (id.includes('render') || id.includes('guard') || id.includes('pipeline')) return 'production';
    if (id.includes('post') || id.includes('production') || id.includes('audio') || 
        id.includes('quality') || id.includes('oracle')) return 'post_production';
    return 'pre_production';
  }

  /**
   * 执行融合 Pipeline
   * @param {Object} input - 输入数据
   * @param {Object} options
   * @param {Array<String>} options.includeSkills - 指定执行的 Skill ID
   * @param {Array<String>} options.excludeSkills - 排除的 Skill ID
   * @param {Object} options.stageSequence - 自定义 Stage 顺序
   */
  async execute(input, options = {}) {
    if (!this.initialized) await this.initialize();
    
    const traceId = options.traceId || `fusion_${Date.now()}`;
    console.log(`[Fusion] ▶️ 执行 Pipeline | traceId=${traceId}`);
    
    // 发布 pipeline 开始事件
    this.eventBus.publish('pipeline.started', {
      traceId,
      stageCount: Object.keys(this.dynamicStageDefinitions).length,
      includedSkills: options.includeSkills,
      excludedSkills: options.excludeSkills
    }, { traceId });
    
    // 构建执行序列
    const stageSequence = this._buildStageSequence(options);
    
    // 执行上下文（累积所有 Stage 输出）
    const context = { ...input, _traceId: traceId };
    const executedStages = [];
    let overallStatus = 'success';
    
    // 按顺序执行每个 Stage
    for (const stageId of stageSequence) {
      const stageDef = this.dynamicStageDefinitions[stageId];
      const skillId = stageDef._skillId;
      const instance = this.skillInstances.get(skillId);
      
      if (!instance) {
        console.warn(`[Fusion] ⚠️ Skill 实例不存在: ${skillId}`);
        continue;
      }
      
      // 发布 stage 开始事件
      this.eventBus.publish('stage.started', { 
        stageId, 
        skillId, 
        traceId,
        stage: stageId
      }, { traceId });
      
      const stageStart = Date.now();
      let stageResult;
      
      try {
        // 调用 Skill.execute()
        console.log(`[Fusion] 🔧 执行 Skill: ${skillId} (Stage ${stageId})`);
        const output = await instance.execute(context, { traceId });
        
        // 将输出合并到上下文
        Object.assign(context, output);
        
        stageResult = {
          stageId,
          skillId,
          status: 'success',
          duration: Date.now() - stageStart
        };
        
        this.eventBus.publish('stage.completed', { 
          ...stageResult, 
          traceId,
          stage: stageId
        }, { traceId });
        
      } catch (error) {
        console.error(`[Fusion] ❌ Skill 执行错误: ${skillId} | ${error.message}`);
        console.error(error.stack);
        
        stageResult = {
          stageId,
          skillId,
          status: 'failed',
          error: error.message,
          duration: Date.now() - stageStart
        };
        
        this.eventBus.publish('stage.failed', { 
          ...stageResult, 
          traceId,
          stage: stageId
        }, { traceId });
        
        // 如果是阻塞 Stage，中断 Pipeline
        if (stageDef.blocking) {
          console.error(`[Fusion] ❌ 阻塞 Stage 失败，Pipeline 中断: ${stageId}`);
          overallStatus = 'failed';
          
          // 触发补偿事务
          await this._compensate(executedStages, context, traceId);
          break;
        } else {
          // 非阻塞（顾问 Stage），记录警告但继续
          console.warn(`[Fusion] ⚠️ 顾问 Stage 失败，继续: ${stageId}`);
          stageResult.status = 'skipped';
        }
      }
      
      executedStages.push(stageResult);
    }
    
    // 发布 pipeline 完成事件
    const completedCount = executedStages.filter(s => s.status === 'success').length;
    this.eventBus.publish(
      overallStatus === 'success' ? 'pipeline.completed' : 'pipeline.failed',
      { 
        traceId, 
        status: overallStatus, 
        executedStages,
        completedCount,
        failedAt: overallStatus === 'failed' ? executedStages.find(s => s.status === 'failed')?.stageId : undefined
      },
      { traceId }
    );
    
    console.log(`[Fusion] ✅ Pipeline 完成 | status=${overallStatus} | traceId=${traceId}`);
    
    return {
      traceId,
      status: overallStatus,
      context,
      executedStages,
      duration: executedStages.reduce((sum, s) => sum + (s.duration || 0), 0)
    };
  }

  /**
   * 构建 Stage 执行序列
   */
  _buildStageSequence(options) {
    const { includeSkills, excludeSkills } = options;
    
    let stages = Object.keys(this.dynamicStageDefinitions);
    
    // 过滤
    if (includeSkills?.length > 0) {
      stages = stages.filter(sid => includeSkills.includes(this.dynamicStageDefinitions[sid]._skillId));
    }
    if (excludeSkills?.length > 0) {
      stages = stages.filter(sid => !excludeSkills.includes(this.dynamicStageDefinitions[sid]._skillId));
    }
    
    // 按阶段排序
    const phaseOrder = { pre_production: 0, production: 1, post_production: 2 };
    stages.sort((a, b) => {
      const phaseA = phaseOrder[this.dynamicStageDefinitions[a].phase] || 0;
      const phaseB = phaseOrder[this.dynamicStageDefinitions[b].phase] || 0;
      return phaseA - phaseB;
    });
    
    return stages;
  }

  /**
   * 补偿事务：回滚已执行的 Skill
   */
  async _compensate(executedStages, context, traceId) {
    console.log('[Fusion] 🔄 触发补偿事务...');
    
    // 逆序回滚
    for (let i = executedStages.length - 1; i >= 0; i--) {
      const stage = executedStages[i];
      const instance = this.skillInstances.get(stage.skillId);
      
      if (instance && typeof instance.shutdown === 'function') {
        try {
          await instance.shutdown();
          console.log(`[Fusion] 🧹 补偿: Skill 已关闭 ${stage.skillId}`);
          this.eventBus.publish('stage.compensated', { stageId: stage.stageId, skillId: stage.skillId }, { traceId });
        } catch (e) {
          console.warn(`[Fusion] ⚠️ 补偿失败: ${stage.skillId} | ${e.message}`);
        }
      }
    }
  }

  /**
   * 获取已注册的 Skill 列表
   */
  listSkills() {
    if (!this.initialized) return [];
    return Array.from(this.skillInstances.entries()).map(([id, instance]) => ({
      id,
      name: instance.config?.name || id,
      version: instance.config?.version || '1.0.0',
      phase: this._inferPhase(id, instance.config || {}),
      status: instance.status || 'unknown'
    }));
  }

  /**
   * 关闭所有 Skill
   */
  async shutdown() {
    if (!this.initialized) return;
    
    console.log('[Fusion] 🛑 关闭融合编排器...');
    
    for (const [id, instance] of this.skillInstances) {
      try {
        if (typeof instance.shutdown === 'function') {
          await instance.shutdown();
          console.log(`[Fusion] 🧹 Skill 已关闭: ${id}`);
        }
      } catch (e) {
        console.warn(`[Fusion] ⚠️ Skill 关闭失败: ${id} | ${e.message}`);
      }
    }
    
    // 只有内部创建的 eventBus 才关闭
    if (!this._externalEventBus && this.eventBus) {
      this.eventBus.removeAllListeners?.();
    }
    
    this.skillInstances.clear();
    this.initialized = false;
    console.log('[Fusion] 🟢 已关闭');
  }
}

module.exports = { SagaSkillFusionOrchestrator, FUSION_CONTEXT_PRESETS };
