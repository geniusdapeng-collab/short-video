/**
 * 广告植入引擎
 * 版本: v0.4.0-commercial
 * 功能: 在15秒超短裙视频中自然植入商品广告
 */

'use strict';

class CommercialImplantEngine {
  constructor(options = {}) {
    this.productManager = options.productManager;
  }

  /**
   * 为视频生成广告植入方案
   * @param {Object} productInfo 商品信息
   * @param {Object} videoPlan 视频计划（3镜头结构）
   * @returns {Object} 植入方案
   */
  generateImplantPlan(productInfo, videoPlan) {
    const strategy = productInfo.implantStrategy || {};
    const category = productInfo.category || 'generic';
    const shots = videoPlan.shots || [];

    // 根据商品类型选择最佳植入方式
    const implantMap = this._getCategoryImplantMap(category);

    const plan = {
      productId: productInfo.id,
      productName: productInfo.name,
      shots: [],
      totalImplantDuration: 0
    };

    for (let i = 0; i < shots.length; i++) {
      const shot = shots[i];
      const shotType = shot.type || 'generic';
      const implant = implantMap[shotType] || implantMap['generic'];
      
      // 计算植入时长（不超过镜头总时长的一半）
      const maxImplantDuration = Math.floor(shot.duration * 0.5);
      const implantDuration = Math.min(implant.duration || 2, maxImplantDuration);

      plan.shots.push({
        shotId: shot.id,
        shotType,
        implantType: implant.type,
        implantPosition: implant.position,
        implantDuration,
        visualDescription: this._generateVisualDescription(productInfo, implant, shotType),
        promptInjection: this._generatePromptInjection(productInfo, implant, shotType)
      });

      plan.totalImplantDuration += implantDuration;
    }

    return plan;
  }

  /**
   * 获取商品类别的植入映射
   */
  _getCategoryImplantMap(category) {
    const maps = {
      beverage: {
        hook: { type: 'reveal', position: 'center', duration: 2, description: '特写拉远 reveal' },
        climax: { type: 'interaction', position: 'hand', duration: 3, description: '手持饮用特写' },
        resolution: { type: 'static', position: 'table', duration: 2, description: '桌面蒸汽定格' },
        generic: { type: 'static', position: 'scene', duration: 2, description: '场景道具' }
      },
      tech: {
        hook: { type: 'reveal', position: 'closeup', duration: 2, description: '屏幕亮起 reveal' },
        climax: { type: 'interaction', position: 'hand', duration: 3, description: '手持使用特写' },
        resolution: { type: 'static', position: 'closeup', duration: 2, description: '指示灯闪烁定格' },
        generic: { type: 'static', position: 'scene', duration: 2, description: '科技道具' }
      },
      wearable: {
        hook: { type: 'reveal', position: 'face', duration: 2, description: '镜片AR界面亮起 reveal' },
        climax: { type: 'interaction', position: 'face', duration: 3, description: '佩戴者视角，AR界面浮现' },
        resolution: { type: 'static', position: 'closeup', duration: 2, description: '眼镜特写，镜片反射倒影' },
        generic: { type: 'static', position: 'scene', duration: 2, description: '智能眼镜场景道具' }
      },
      fashion: {
        hook: { type: 'reveal', position: 'detail', duration: 2, description: '包角特写 reveal' },
        climax: { type: 'interaction', position: 'hand', duration: 3, description: '取出物品特写' },
        resolution: { type: 'static', position: 'body', duration: 2, description: '包身定格' },
        generic: { type: 'static', position: 'wear', duration: 2, description: '时尚单品' }
      }
    };

    return maps[category] || maps['tech'];
  }

  /**
   * 生成视觉描述
   */
  _generateVisualDescription(productInfo, implant, shotType) {
    const features = productInfo.visualFeatures || {};
    const name = productInfo.name;
    const brand = productInfo.brand || '';

    const descriptions = {
      reveal: `${name}AR界面在黑暗中突然亮起，${features.color || ''}镜片反射出巨兽眼睛，从微距拉远 reveal 全景`,
      interaction: `角色佩戴${name}，AR界面浮现数据流，${features.color || ''}，${features.texture || ''}，与巨兽对视`,
      static: `${name}静物特写，${features.color || ''}镜片反射出巨兽倒影，${features.logo || ''}清晰可见`,
      wear: `角色佩戴${name}，${features.color || ''}，${features.shape || ''}，AR光效成为视觉焦点`
    };

    return descriptions[implant.type] || descriptions['static'];
  }

  /**
   * 生成 Prompt 注入内容
   */
  _generatePromptInjection(productInfo, implant, shotType) {
    const features = productInfo.visualFeatures || {};
    const name = productInfo.name;
    const brand = productInfo.brand || '';

    return `【商品植入】${name}（⚠️ 外观必须与参考图完全一致，禁止修改任何文字/标识/Logo）
- 位置: ${implant.position === 'hand' ? '角色手持' : implant.position === 'face' ? '面部佩戴' : implant.position === 'table' ? '桌面中央' : '场景中央'}
- 状态: ${features.color || '自然状态'}，外观、颜色、形状、Logo位置必须与参考图完全一致
- 约束: 不可遮挡，自然融入场景，外观必须与参考图完全一致，禁止修改任何文字、Logo或标识，禁止重新生成或替换文字内容
- 占比: 画面${implant.position === 'hand' || implant.position === 'face' ? '30-50%' : '10-20%'}
- 光影: 与场景统一照明，${features.texture || '质感真实'}`;
  }

  /**
   * 注入商品到 Prompt
   */
  injectIntoPrompt(prompt, implantPlan, shotId) {
    const shot = implantPlan.shots.find(s => s.shotId === shotId);
    if (!shot) return prompt;

    // 在 Prompt 末尾注入商品描述（在【质感】之前）
    const injection = shot.promptInjection;
    
    // 如果 Prompt 有【质感】标记，在质感之前插入
    if (prompt.includes('【质感】')) {
      return prompt.replace('【质感】', `${injection}\n\n【质感】`);
    }
    
    // 否则在末尾追加
    return `${prompt}\n\n${injection}`;
  }

  /**
   * 生成商品定妆照引用配置
   */
  generateReferenceImages(productInfo, implantPlan) {
    const refs = [];
    const portraits = productInfo.portraits || {};

    // 根据植入位置选择最合适的定妆照
    const portraitPriority = ['closeup', 'front', 'threeQuarter', 'side'];
    
    for (const key of portraitPriority) {
      if (portraits[key]) {
        refs.push({
          imageUrl: portraits[key],
          type: 'product',
          weight: 0.8,
          description: `${productInfo.name} ${key} view`
        });
        break; // 只取一张主要定妆照
      }
    }

    return refs;
  }

  /**
   * 生成商业化报告
   */
  generateCommercialReport(implantPlan, videoId) {
    const totalDuration = implantPlan.totalImplantDuration || 0;
    const totalVideoDuration = 15;
    const exposureRatio = Math.round((totalDuration / totalVideoDuration) * 100);

    return {
      videoId,
      productName: implantPlan.productName,
      productId: implantPlan.productId,
      implantShots: implantPlan.shots.map(s => ({
        shotId: s.shotId,
        type: s.implantType,
        position: s.implantPosition,
        duration: s.implantDuration
      })),
      totalImplantDuration: totalDuration,
      exposureRatio: `${exposureRatio}%`,
      estimatedValue: this._calculateValue(exposureRatio),
      timestamp: new Date().toISOString()
    };
  }

  _calculateValue(exposureRatio) {
    // 简单的定价模型
    if (exposureRatio >= 40) return 3000;
    if (exposureRatio >= 30) return 2000;
    if (exposureRatio >= 20) return 1000;
    return 500;
  }
}

module.exports = { CommercialImplantEngine };
