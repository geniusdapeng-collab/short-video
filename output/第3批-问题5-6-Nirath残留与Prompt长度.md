# 卓越系统 v6.6.5 - 第3批问题分析（问题5 + 问题6）

> 按外部专家建议，分4批打包，每批只包含3-8个相关文件。
> 第3批：问题5（Nirath描述渗漏）+ 问题6（Prompt长度限制矛盾）

---

## 调用链

```
入口脚本 run-health-edu-ep01.js (mode='generic')
  -> NirathMasterPipeline::execute(input)
     -> Stage 4: stageCharacters()
        -> CharacterManagerV2::createCharacter() / loadCharacter()
           -> _buildMinimalAnchor() -> 默认 race='Nirath异兽' ← 根因
     -> Stage 7: stageStoryboardGeneration()
        -> 日志: "故事板生成(... + Nirath场景映射)"
     -> Stage 11: stageRender()
        -> smartTrim(prompt, 1500) -> 截断到1500字符
        -> finalFillPrompt() -> 目标1470/硬上限1500
     -> Stage 12: PromptBridge
        -> processShotsForCompliance(shots, { maxLength: 1500 })
```

---

## 问题5：Nirath描述渗漏（generic模式下不应出现）

### 现象
- 健康科普视频（generic模式）中，角色档案包含Nirath描述
- `preproduction-result.json` 中：`"minimalAnchor": "陈卓: Nirath异兽, Nirath原生特征, 双恒星光照反射"`
- 系统日志显示：
  - `"角色系统(v2 + Nirath增强)"`
  - `"故事板生成(... + Nirath场景映射)"`
  - `"检测到Nirath关键词，generic模式拒绝注入"`（说明系统在检测，但minimalAnchor本身已经是Nirath）

### 期望
- generic模式下，所有Nirath相关描述应被完全排除
- 角色minimalAnchor应为地球人类描述，如：`"陈卓: 人类, 30岁女性, 穿警服"`
- 系统日志不应出现Nirath增强或Nirath场景映射字样

### 根因分析
1. **`character-manager-v2.js` `_buildMinimalAnchor()` 方法硬编码Nirath**：
   ```javascript
   const race = characterData.race || characterData.species || 'Nirath异兽';
   // 如果物种为空，默认 'Nirath异兽'
   if (uniqueKeywords.length < 3) {
     uniqueKeywords.push('Nirath原生特征', '双恒星光照反射'); // 硬编码
   }
   ```

2. **系统日志硬编码Nirath字样**：
   - `stageCharacters()` 日志：`"角色系统(v2 + Nirath增强)"`
   - `stageStoryboard()` 日志：`"故事板生成(... + Nirath场景映射)"`
   - 即使 `mode='generic'`，这些日志仍然出现，说明模块名称本身带有Nirath

3. **合规检测反被Nirath污染**：
   - `prompt-pipeline-bridge.js` 中 `processShotsForCompliance()` 检测 `"Prompt缺少Nirath风格锚点"`
   - 在generic模式下，这不应该是一个检测项

---

## 问题6：Prompt长度限制矛盾（配置说988 vs 实际用1500）

### 现象
- `config/prompt-length.js` 定义：目标 889-988，硬上限 988
- `nirath-master-pipeline.js` 中：`smartTrim(prompt, 1500)`、`finalFillPrompt(target=1470, hardLimit=1500)`
- `prompt-pipeline-bridge.js` 中：`maxLength = 1500`
- 实际输出：每个镜头Prompt**正好1500字符**（被截断）

### 期望
- 配置文件的限制应被系统实际执行
- 或：如果1500是正确值，应更新配置文件以反映实际限制
- 不应出现配置文件和实际代码不一致的情况

### 根因分析
1. **配置文件被架空**：
   - `config/prompt-length.js` 定义 `HARD_MAX=988`
   - 但 `nirath-master-pipeline.js` 中从未引用 `PROMPT_LENGTH.HARD_MAX`
   - 而是直接使用硬编码的 `1500`

2. **多处硬编码1500**：
   - `nirath-master-pipeline.js` line 5696: `smartTrim(enhanced.prompt, 1500)`
   - `nirath-master-pipeline.js` line 5787: `smartTrim(prompt, 1500)`
   - `nirath-master-pipeline.js` line 5683: `if (enhanced.prompt.length + vividnessDetails.length + 2 <= 1500)`
   - `prompt-pipeline-bridge.js` line 144: `maxLength: options.maxLength || 1500`
   - `astralis-core-engine.js` line 219: `checkPromptLength(prompt, 1470, 1500)`

3. **长度利用率计算基于1500**：
   ```javascript
   utilization: Math.round(prompt.length / 1500 * 100),
   utilizationStatus: prompt.length >= 970 && prompt.length <= 1500 ? '🔥理想' : '❌超标'
   ```
   - 即使配置文件说988，利用率计算仍以1500为基准

---

# 相关文件（完整）

## 文件1: config/prompt-length.js（完整）

```javascript
// 统一 Prompt 长度配置（唯一真源）
// 目标：总长度稳定落在 889-988 字符区间

module.exports = {
  TARGET_MIN: 889,
  TARGET_MAX: 988,
  HARD_MAX: 988,

  // 保留兼容字段，但不再依赖固定模板长度
  SYSTEM_TEMPLATE_LEN: 0,

  getCreativeTarget(systemTemplateLen = 0) {
    return {
      min: Math.max(0, this.TARGET_MIN - systemTemplateLen),
      max: Math.max(0, this.TARGET_MAX - systemTemplateLen)
    };
  },

  validate(length) {
    return length >= this.TARGET_MIN && length <= this.TARGET_MAX;
  },

  getStatus(length) {
    if (length > this.HARD_MAX) return 'overflow';
    if (length < this.TARGET_MIN) return 'underflow';
    if (length <= this.TARGET_MAX) return 'ideal';
    return 'unknown';
  }
};
```

---

## 文件2: systems/prompt-pipeline-bridge.js（关键部分）

```javascript
// ============================================================
// 三、统一 Prompt 构建
// ============================================================

function buildPromptObject(shot, options = {}) {
  const originalPrompt = getPrimaryPromptText(shot);

  const promptObj = standardizePromptObject(originalPrompt, {
    maxLength: options.maxLength || 1500  // ← 硬编码1500，未读取config
  });

  return {
    rawPrompt: promptObj.rawPrompt,
    standardizedPrompt: promptObj.standardizedPrompt,
    renderFriendlyPrompt: promptObj.renderFriendlyPrompt,
    finalPrompt: promptObj.finalPrompt
  };
}

function applyPromptObjectToShot(shot, options = {}) {
  if (!shot || typeof shot !== 'object') return shot;

  return applyStandardizedPromptToShot(shot, {
    maxLength: options.maxLength || 1500  // ← 硬编码1500，未读取config
  });
}

// ============================================================
// 四、主链路批量标准化
// ============================================================

function normalizeShotsPrompts(shots = [], options = {}) {
  const {
    promptforgeResultDir = '',
    promptforgeMarkdownDir = '',
    maxLength = 1500  // ← 硬编码1500，未读取config
  } = options;

  return shots.map((shot) => {
    let s = { ...shot };

    if (promptforgeResultDir) {
      s = injectPromptForgeResultIntoShot(s, promptforgeResultDir);
    }

    if (!safeText(s.promptforgePrompt) && promptforgeMarkdownDir) {
      s = injectPromptForgeMarkdownResultIntoShot(s, promptforgeMarkdownDir);
    }

    s = applyPromptObjectToShot(s, { maxLength });

    return s;
  });
}
```

---

## 文件3: zhuoyue-system/core/nirath-master-pipeline.js（smartTrim + finalFillPrompt 方法）

```javascript
  /**
   * v6.2-patch56: 智能截断文本，保留核心区块
   * 截断到 maxLength 字符，优先保留核心标记（如【音频】【运镜】）
   */
  smartTrim(prompt, maxLength, options = {}) {
    const { preserve = [], trim = [] } = options;

    if (prompt.length <= maxLength) return prompt;

    // Step 1: 将Prompt拆分为区块(按【xxx】标记分割)
    const blocks = [];
    const markerPattern = /【([^【】]+)】/g;
    let lastIndex = 0;
    let match;

    while ((match = markerPattern.exec(prompt)) !== null) {
      if (match.index > lastIndex) {
        blocks.push({ type: 'plain', content: prompt.substring(lastIndex, match.index), isCore: false });
      }

      const markerName = match[1];

      const nextMatch = markerPattern.exec(prompt);
      markerPattern.lastIndex = match.index + match[0].length;

      let endPos;
      if (nextMatch) {
        endPos = nextMatch.index;
        markerPattern.lastIndex = nextMatch.index;
      } else {
        endPos = prompt.length;
      }

      const blockContent = prompt.substring(match.index, endPos);

      const isTrim = trim.some(t => markerName.includes(t) || t.includes(markerName));
      const isPreserve = preserve.some(p => markerName.includes(p) || p.includes(markerName));

      blocks.push({
        type: 'marked',
        marker: markerName,
        content: blockContent,
        isCore: isPreserve,
        isTrim: isTrim
      });

      lastIndex = endPos;
    }

    // 剩余文本
    if (lastIndex < prompt.length) {
      blocks.push({ type: 'plain', content: prompt.substring(lastIndex), isCore: false });
    }

    // Step 2: 先移除trim列表中的区块
    const afterTrim = blocks.filter(b => !b.isTrim);
    let currentLength = afterTrim.reduce((sum, b) => sum + b.content.length, 0);

    if (currentLength <= maxLength) {
      return afterTrim.map(b => b.content).join('');
    }

    // Step 3: 保留核心区块，裁剪非核心区块
    let result = '';
    let resultLength = 0;

    const audioBlocks = afterTrim.filter(b => b.marker === '音频' || (b.type === 'plain' && b.isCore));
    const otherCoreBlocks = afterTrim.filter(b => b.isCore && !audioBlocks.includes(b));
    
    for (const block of audioBlocks) {
      if (resultLength + block.content.length <= maxLength) {
        result += block.content;
        resultLength += block.content.length;
      }
    }
    
    for (const block of otherCoreBlocks) {
      if (resultLength + block.content.length <= maxLength) {
        result += block.content;
        resultLength += block.content.length;
      }
    }

    for (const block of afterTrim) {
      if (!block.isCore) {
        const remaining = maxLength - resultLength;
        if (remaining <= 0) break;
        if (block.content.length <= remaining) {
          result += block.content;
          resultLength += block.content.length;
        } else {
          const partial = this.trimAtPunctuation(block.content, remaining);
          result += partial;
          resultLength += partial.length;
        }
      }
    }

    return result;
  }

  // v6.3-patch10-fix: 最终兜底补齐
  finalFillPrompt(prompt, shotId) {
    let out = String(prompt || '').trim();
    const target = 1470;  // ← 目标1470
    const hardLimit = 1500; // ← 硬上限1500

    if (charCounter.count(out) >= target) return out;

    const fillers = [
      '电影级超写实环境叙事与层叠空间深度',
      '顶级材质保真与物理可信纹理响应',
      '体积光分离与大气深度对比控制',
      '清晰主体可读性与稳定视觉身份连续性',
      '微妙环境微观动态与粒子运动',
      '受控摄影机节奏与刻意焦点迁移',
      '神话异星生态, 晶化地形, 能量脉络景观逻辑',  // ← Nirath残留！
      '高端CG写实, 扎根尺度感知',
      '微表情完整性, 姿态写实, 呼吸节奏, 稳定身体力学'
    ];

    for (const item of fillers) {
      if (charCounter.count(out) >= target) break;
      const next = `${out}, ${item}`;
      if (charCounter.count(next) <= hardLimit) {
        out = next;
      }
    }

    if (charCounter.count(out) > hardLimit) {
      out = charCounter.truncate(out, hardLimit);
    }

    return out;
  }
```

---

## 文件4: 真实日志（Nirath残留 + Prompt长度证据）

### 4.1 预生产结果中的Nirath残留

```json
// 来自 /root/.openclaw/workspace/output/health-edu-ep01/preproduction-result.json

// 角色档案中的Nirath残留
{
  "stage": "STAGE-4",
  "message": "角色系统(v2 + Nirath增强)"
},
{
  "stage": "STAGE-7",
  "message": "故事板生成(结构化生成器 + mouthAction字段 + Nirath场景映射)"
},
{
  "stage": "STAGE-7.2",
  "message": "⏭️ generic模式,跳过Nirath专属主动性注入"
},
{
  "stage": "STAGE-11",
  "message": "  🎨 布景增强跳过: S01 | 检测到Nirath关键词，generic模式拒绝注入"
},
// ... 重复6次（S01-S06）

// 角色minimalAnchor
{
  "stage": "STAGE-4",
  "data": {
    "minimalAnchor": "陈卓: Nirath异兽, Nirath原生特征, 双恒星光照反射"
  }
}

// 合规检查中的Nirath误报
{
  "stage": "STAGE-12",
  "issues": ["Prompt缺少Nirath风格锚点"]
}
```

### 4.2 预生产结果中的Prompt长度证据

```json
// 每个镜头Prompt长度正好1500字符（被截断）
{
  "id": "S01",
  "prompt": "【视觉】DIRECTOR: 通用导演风格 | NEGATIVE: no text...",
  "length": 1500
},
{
  "id": "S02",
  "prompt": "【视觉】DIRECTOR: 通用导演风格 | NEGATIVE: no text...",
  "length": 1500
},
{
  "id": "S03",
  "prompt": "【视觉】DIRECTOR: 通用导演风格 | NEGATIVE: no text...",
  "length": 1500
}

// 利用率计算基于1500
{
  "utilization": 100,  // 1500/1500 = 100%
  "utilizationStatus": "🔥理想"
}
```

---

## 问题对比表

| 问题 | 配置文件定义 | 实际代码行为 | 结果 |
|------|------------|-------------|------|
| Prompt长度上限 | `HARD_MAX=988` | `smartTrim(1500)` | ❌ 矛盾 |
| Prompt长度目标 | `TARGET_MAX=988` | `finalFillPrompt(target=1470)` | ❌ 矛盾 |
| 利用率计算 | 应基于988 | 实际基于1500 | ❌ 矛盾 |
| generic模式 | 应无Nirath | minimalAnchor含Nirath | ❌ 渗漏 |
| 系统日志 | 应generic通用 | 显示Nirath增强/映射 | ❌ 残留 |
| 合规检查 | 应通用标准 | 检查Nirath风格锚点 | ❌ 误报 |

---

> 第3批打包完毕。如需第4批（问题8：任意其他问题），请继续提供。
