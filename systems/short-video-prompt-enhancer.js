/** =============
 * 超短裙Prompt增强器
 * 短描述 → 长Prompt（15秒极致化）
 * 版本: v0.2.0-fix
 ============= */

class ShortVideoPromptEnhancer {
  constructor(options = {}) {
    this.maxPromptLength = options.maxPromptLength || 980;
    this.targetLength = options.targetLength || 950;
    this.mode = options.mode || 'short-brutalism';
  }

  enhanceDescription(description, shot = {}) {
    if (!description || description.length < 50) {
      return this.expandShortDescription(description, shot);
    }
    return description;
  }

  expandShortDescription(description, shot) {
    const { id = '', name = '', duration = 5, type = 'standard' } = shot;
    
    const expansions = {
      hook: `【超短裙钩子镜头·黄金3秒】
${description}

【镜头时间轴】${duration}秒完整钩子：0.0-0.5秒画面从纯黑撕裂出光，0.5-1.5秒极速环绕推进冲击主体，1.5-2.5秒急拉俯冲透视全景，2.5-${duration}秒瞳孔锁定静止凝视。不给眨眼机会。

【声音设计】纯黑中的心跳声（低频咚咚，越来越急）→ 撕裂瞬间的轰鸣（能量释放，炸裂感）→ 瞳孔锁定时的寂静（所有声音消失，只有呼吸）。音效比画面更恐怖。

【视觉暴力】画面从纯黑开始，突然撕开一道光。观众没有任何准备，直接坠入画面。这不是渐显，是爆炸。推进镜头如子弹出膛，瞬间击穿黑暗。

【光影雕刻】高对比度Chiaroscuro，主体只有轮廓被照亮，其余沉入绝对黑暗。不是柔和过渡，是刀切般的明暗分界。Key Light从极低角度打亮，创造压迫感。冷色Rim光刀切轮廓，无Fill光，绝对黑暗。

【运镜组合】极速环绕推进 → 急拉俯冲 → 瞳孔锁定。0.5秒内完成视角切换，不给观众眨眼的机会。镜头如猛兽扑食，迅猛推进又猛然拉远。

【情绪核】恐惧+好奇。观众必须想知道：这是什么？下一秒会发生什么？

【悬念钩子】第3秒结束时，眼睛睁开了，但瞳孔中倒映的不是观众——而是某个正在逼近的巨物轮廓。观众必须想知道：那是什么？！

【记忆锚点】最后一帧：瞳孔特写，里面倒映着未知威胁。这是截图帧，这是朋友圈帧。

【分享触发】画面太炸裂了，必须给朋友看。"你看这个眼睛，里面有什么！"

【台词】"眼睛醒了，梦还没醒。"（反转：谁在谁的梦里？）

【质感】超写实，8K，电影级，每一帧都是壁纸。`,

      climax: `【超短裙高潮镜头·情绪峰值】
${description}

【镜头时间轴】${duration}秒情绪峰值：0.0-1.0秒微距急速推进抓取细节，1.0-3.0秒仰冲升空揭示全景，3.0-5.0秒悬浮凝视环绕主体，5.0-${duration}秒定格冻结记忆锚点。时间在此刻燃烧。

【声音设计】低频轰鸣（地面震动）→ 高频尖啸（巨兽觉醒）→ 咆哮爆发（声浪席卷）→ 最后3秒寂静（只有心跳）。音画同步炸裂。

【视觉暴力】画面必须满到溢出。没有空白，没有呼吸，只有信息轰炸。主体占画面70%以上，压迫感扑面而来。镜头急速推进冲击视网膜，又如巨浪般拉远席卷全景。

【光影雕刻】Rembrandt过渡到Silhouette。先照亮细节，然后逆光吞噬一切，只剩轮廓。最后Golden Hour从边缘渗入，像希望从绝望中诞生。侧光雕刻纹理，逆光勾勒轮廓，柔光填充细节。

【运镜组合】微距急速推进 → 仰冲升空 → 悬浮凝视环绕。从微距纹理到全景震撼，再到悬浮凝视。镜头如巨浪般推进，又如雄鹰般俯冲拉升，最后环绕主体缓缓旋转。

【情绪核】敬畏+震撼。观众必须感到渺小，感到被碾压，然后感到升华。

【悬念钩子】巨兽升起到一半时，突然停顿——它的目光直视镜头，仿佛在看观众。那一刻，观众不是旁观者，是猎物。

【记忆锚点】最后一帧：巨兽与观众对视，瞳孔中的倒影是观众自己。这是"被看见"的恐惧，永生难忘。

【分享触发】"这个巨兽在看我！！"——观众必须截图发朋友圈。

【台词】"我以为在狩猎它，结果我是猎物。"（反转：猎人与猎物的身份互换）

【质感】超写实，8K，电影级。材质纹理清晰可数：毛孔、纤维、划痕、尘埃。`,

      resolution: `【超短裙收束镜头·记忆锚点】
${description}

【镜头时间轴】${duration}秒收束定格：0.0-1.0秒缓推逼近核心细节，1.0-3.0秒微距环绕旋转凝视，3.0-${duration}秒定格冻结时间停止。这是观众离开后唯一记得的画面。

【声音设计】咆哮回声渐弱（余波荡漾）→ 心跳声回归（慢速，沉重）→ 最后1秒完全寂静（留白）。声音消散，记忆永存。

【视觉暴力】画面收敛到一个点。可以是眼睛、可以是嘴、可以是一个手势。但必须是一个点，观众离开后唯一记得的点。镜头缓缓推进锁定这个点，如箭矢般精准。

【光影雕刻】Golden Hour暖调，但冷色在阴影中潜伏。表面温暖，深处冰冷。就像微笑背后的危险。侧光勾勒轮廓，暖调填充主体，冷光暗藏阴影。

【运镜组合】缓推逼近 → 微距环绕旋转 → 定格冻结。推向特写，环绕凝视，然后定格。时间在此刻停止。镜头如猎人般悄然推进，又如舞者般轻盈环绕，最后凝固成永恒画面。

【情绪核】满足+不安。观众得到了答案，但答案让他们不安。这是记忆锚点。

【悬念钩子】收束时，画面边缘闪过一丝异动——似乎还有什么没结束。观众看完15秒，但感觉故事才刚开始。

【记忆锚点】最后一帧：主角的眼神，里面有整个故事。截图、发朋友圈、配文"这是开始，不是结束"。

【分享触发】15秒结束，但观众想@朋友来看。"你看完这个，告诉我你看到了什么。"

【台词】"15秒，够记住一辈子。"（深度：时间极短但记忆永恒）

【质感】超写实，8K，电影级。最后的画面必须值得截图。`,

      standard: `【超短裙镜头·极致压缩】
${description}

【镜头时间轴】${duration}秒极致压缩：0.0-1.0秒快速推进抓取主体，1.0-3.0秒环绕扫视环境全貌，3.0-${duration}秒定格聚焦核心。没有铺垫，直接进入。

【视觉暴力】每一帧都是信息，没有浪费。画面密度必须高，但不乱。主体突出，背景服务。镜头快速推进抓取细节，又猛然拉远展现全貌。

【光影雕刻】3光源极简：Key定义情绪，Rim雕刻轮廓，Fill保留细节。不花哨，精准。侧光打亮主体，逆光勾勒边缘，柔光填充暗部。

【运镜组合】至少2段运镜变化。推进抓取细节，拉远展现全景，环绕扫视环境。静态是犯罪。即使微动，也要动。镜头如呼吸般节奏推进，又如旋风般环绕扫视。

【情绪核】15秒只有一个情绪，但这个情绪必须极致。

【质感】超写实，8K，电影级。壁纸级。`
    };

    let template = expansions[type] || expansions.standard;
    
    if (duration <= 3) {
      template += `

【3秒法则】
- 第1秒：画面必须已经完整（不能渐入）
- 第2秒：高潮必须到达（不能铺垫）
- 第3秒：必须留下钩子（不能结束）`;
    }

    return template;
  }

  /**
   * 为超短裙模式增强所有场景描述
   * 核心：修改 description、narration、visualPrompt 三个字段
   * 确保后续 stage 能读取到增强后的内容
   * 🩲 v0.2.0-optimize: 增加截断保护，确保输出≤980字符
   */
  enhanceScenes(scenes) {
    if (!Array.isArray(scenes)) return scenes;
    
    return scenes.map((scene, index) => {
      const shot = {
        id: scene.id || `S${String(index + 1).padStart(2, '0')}`,
        name: scene.name || `镜头${index + 1}`,
        duration: scene.duration || 5,
        type: scene.type || 'standard'
      };
      
      // 兼容多种描述字段名（description / narration / dialogue / scene / visualPrompt）
      const rawDesc = scene.description || scene.narration || scene.dialogue || scene.scene || scene.visualPrompt || '';
      let enhanced = this.enhanceDescription(rawDesc, shot);
      
      // 🩲 v0.2.0-optimize: 截断保护，确保≤980字符
      if (enhanced.length > 980) {
        const originalLength = enhanced.length;
        // 保留前800字符核心内容，后180字符留给模板尾部
        enhanced = enhanced.substring(0, 980);
        // 确保不截断在标签中间
        const lastTag = enhanced.lastIndexOf('【');
        if (lastTag > 0 && enhanced.indexOf('】', lastTag) === -1) {
          enhanced = enhanced.substring(0, lastTag);
        }
        console.log(`🩲 截断保护: ${shot.id} ${originalLength}字符 → ${enhanced.length}字符`);
      }
      
      return {
        ...scene,
        // 同时修改三个字段，确保后续stage无论读取哪个字段都能得到增强内容
        description: enhanced,
        narration: enhanced,
        visualPrompt: enhanced, // 关键：stage 7 的 mapStoryboard 用 visualPrompt
        dialogue: enhanced,     // 兼容：有些stage用 dialogue
        scene: enhanced,        // 兼容：有些stage用 scene 字段
        // 标记为超短裙增强
        _shortVideoEnhanced: true,
        _originalLength: rawDesc.length,
        _enhancedLength: enhanced.length
      };
    });
  }

  generateShortCameraMovement(shotType, duration) {
    const movements = {
      hook: [
        { type: 'fast_orbit', intensity: 'extreme', duration: 0.5 },
        { type: 'whip_tilt', intensity: 'extreme', duration: 0.5 },
        { type: 'eye_lock', intensity: 'high', duration: duration - 1 }
      ],
      climax: [
        { type: 'macro_push', intensity: 'extreme', duration: 1 },
        { type: 'crane_surge', intensity: 'extreme', duration: 2 },
        { type: 'slow_float', intensity: 'high', duration: duration - 3 }
      ],
      resolution: [
        { type: 'slow_push', intensity: 'high', duration: 1 },
        { type: 'micro_orbit', intensity: 'medium', duration: 1 },
        { type: 'freeze', intensity: 'high', duration: duration - 2 }
      ]
    };
    return movements[shotType] || movements.climax;
  }

  generateShortLighting(shotType) {
    const lightings = {
      hook: {
        key: '极低角度Key Light，高对比Chiaroscuro',
        rim: '冷色Rim，刀切轮廓',
        fill: '无Fill，绝对黑暗',
        effect: '只有眼睛/轮廓在发光'
      },
      climax: {
        key: 'Rembrandt过渡到Silhouette',
        rim: '逆光吞噬',
        fill: 'Golden Hour边缘渗入',
        effect: '先细节后轮廓最后希望'
      },
      resolution: {
        key: 'Golden Hour暖调',
        rim: '冷色在阴影潜伏',
        fill: '微妙补光',
        effect: '表面温暖，深处冰冷'
      }
    };
    return lightings[shotType] || lightings.climax;
  }
}

module.exports = { ShortVideoPromptEnhancer };
