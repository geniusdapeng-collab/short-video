# 用户需求解析确认模块融合架构设计

## 队长需求
- 新增最前置模块：用户需求解析确认技能
- 解决用户表达不清的问题，系统化输出结构化需求
- 数据字段全链路统一：需求要点清单 → PRD → Schema → 主链路
- 多花时间在分析和设计上

---

## 一、模块定位分析

### 1.1 当前系统架构（v6.5.66）

```
用户输入 → execute() → Stage 0-17 → 输出
         ↑
         └─ 无需求解析层，用户直接输入结构化数据
```

### 1.2 新增模块后的架构（v6.6.0+）

```
用户自然语言 → [需求解析确认模块] Stage -1 → 结构化需求清单 → 
                                                    ↓
用户确认/修改 ← [反馈迭代] ← 确认后的需求 ←  [PRD生成] Stage 0-1 → 
                                                    ↓
                                              现有主链路 Stage 2-17
```

**核心变化**：用户不再直接输入 JSON，而是说自然语言。系统解析后输出结构化清单，用户确认后再进入生产。

---

## 二、数据字段全链路统一设计（核心）

### 2.1 字段映射总表

| 需求清单字段 | 清单编码 | 需求解析输出 | PRD 中央字段 | Schema 字段 | 主链路 input | 映射策略 |
|-------------|---------|-------------|-------------|------------|------------|---------|
| **视频类型** | EDU/SOC/ADV/DOC/DRAMA/COR/EVT/VLOG/MV | videoType | videoType | videoType | input.videoType | 直接映射，编码一致 |
| **视频主题** | - | title, topic | projectTitle | projectName | input.title | 直接映射 |
| **主讲人/角色** | - | characters[] | characterProfiles | characters | input.characters[] | 直接映射 |
| **目标受众** | - | targetAudience | targetAudience | targetAudience | input.core.targetAudience | 直接映射 |
| **投放平台** | - | platform | platform | - | input.core.platform | 新增字段 |
| **视频时长** | - | duration, targetDuration | targetDuration | duration.total | input.targetDuration | 直接映射 |
| **画幅比例** | 9:16/16:9/1:1/3:4 | aspectRatio | aspectRatio | ratio | input.ratio | 直接映射 |
| **画面风格** | REAL/CINE/POL/MINI/RET/FUT/ART/WARM/STREET/FAIRY | style.primaryStyle | style | style | input.style | 编码→描述映射 |
| **辅助风格** | +LUX/+VIV/+EMO/+NAT/+GRI/+SWE/+DAR/+NOS | style.secondaryStyles | - | - | input.styleModifiers | 新增字段 |
| **画质等级** | standard/premium/artistic | qualityLevel | quality | quality | input.quality | 直接映射 |
| **创意指数** | 0.0-1.0 | creativeIntensity | creativeIntensity | - | input.creativeIntensity | 直接映射 |
| **叙事方式** | dialogue/narration/interview/drama | narrativeMode | narrativeMode | - | input.narrativeMode | 新增字段 |
| **内容风格** | professional/casual/emotional/funny | contentTone | contentTone | - | input.core.tone | 映射到 tone |
| **视觉风格** | - | visualStyle | visualStyle | - | input.visualStyle | 新增字段 |
| **音乐风格** | - | musicStyle | musicStyle | - | input.musicStyle | 新增字段 |
| **片头设计** | - | openingConfig | openingConfig | opening | input.opening | 直接映射 |
| **内容结构** | - | scenes[] | sceneList | scenes | input.scenes[] | 直接映射 |
| **结尾处理** | - | endingStyle | endingStyle | - | input.constraints.endingStyle | 新增约束 |
| **系列规划** | - | seriesConfig | seriesConfig | - | input.episode, input.totalEpisodes | 直接映射 |
| **特殊要求** | - | specialRequirements | specialRequirements | - | input.constraints | 映射到 constraints |
| **决策说明** | - | aiDecisionNotes | aiDecisionNotes | - | - | 仅用于审阅，不进入生产 |

### 2.2 关键设计决策

**决策1：编码系统统一**
- 需求解析模块使用编码：EDU/ADV/REAL/CINE/+LUX 等
- PRD 和主链路直接使用编码或描述
- 风格编码在 Prompt 中需要展开为中文描述（如 REAL → "写实纪实风格"）

**决策2：新增字段处理**
- `platform`（投放平台）：影响画幅比例和风格推荐，需要新增
- `narrativeMode`（叙事方式）：影响 Stage 5 剧本生成逻辑，需要新增
- `visualStyle`（视觉风格）：影响 Stage 11 渲染核心提示词，需要新增
- `musicStyle`（音乐风格）：影响 Stage 15 后期处理，需要新增
- `styleModifiers`（辅助风格）：影响创意指数激活模块，需要新增
- `aiDecisionNotes`（决策说明）：仅用于用户确认，不进入生产链路

**决策3：字段优先级**
- P0：用户明确指定 → 直接传递，无需推断
- P1：语义推断 → 需求解析模块推断，写入 `aiDecisionNotes` 供用户确认
- P2：类型默认 → 根据 videoType 自动套用默认值
- P3：专业决策 → 系统内部决策，不暴露给用户

---

## 三、融合架构设计

### 3.1 模块接口设计

```javascript
class UserRequirementParser {
  /**
   * 解析用户自然语言输入，输出结构化需求清单
   * @param {string} userInput - 用户自然语言描述
   * @param {Object} options - 解析选项
   * @returns {RequirementParseResult} 解析结果
   */
  async parse(userInput, options = {}) {
    // 1. 语义解析：提取关键词、实体、意图
    // 2. 推断补全：基于规则库补全缺失字段
    // 3. 约束检查：确保在系统硬约束内
    // 4. 生成清单：输出结构化的 RequirementParseResult
  }
  
  /**
   * 根据用户反馈迭代需求清单
   * @param {RequirementParseResult} currentResult - 当前清单
   * @param {string} userFeedback - 用户修改意见
   * @returns {RequirementParseResult} 更新后的清单
   */
  async iterate(currentResult, userFeedback) {
    // 1. 解析用户反馈（修改意见/新增要求）
    // 2. 更新对应字段
    // 3. 重新检查约束
    // 4. 输出更新后的清单
  }
  
  /**
   * 将需求清单转换为 pipeline 输入格式
   * @param {RequirementParseResult} result - 确认后的需求清单
   * @returns {Object} 兼容现有 input 格式的对象
   */
  toPipelineInput(result) {
    // 字段映射：需求清单字段 → 现有 input 格式
  }
}
```

### 3.2 需求解析结果结构（RequirementParseResult）

```json
{
  "version": "1.0",
  "parseStatus": "complete", // complete / partial / insufficient
  
  // 一、基本信息
  "basicInfo": {
    "videoType": "EDU",         // 编码
    "videoTypeName": "教育科普",
    "title": "横纹肌溶解科普",
    "topic": "全民健康科普",
    "characters": [
      {
        "id": "chen-nurse",
        "name": "陈卓",
        "role": "host",
        "description": "穿警服的护士小姐姐"
      }
    ],
    "targetAudience": "普通大众",
    "platform": "视频号/抖音/B站"
  },
  
  // 二、制作规格
  "productionSpecs": {
    "duration": {
      "target": 65,              // 用户目标时长
      "recommended": 65,         // 系统推荐时长
      "min": 59,
      "max": 65,
      "unit": "seconds"
    },
    "aspectRatio": "9:16",
    "style": {
      "primary": "REAL",         // 编码
      "primaryName": "写实纪实",
      "secondary": ["WARM"],     // 编码数组
      "secondaryNames": ["温暖治愈"]
    },
    "quality": "artistic",       // 对应创意指数
    "creativeIntensity": 0.6,
    "colorTone": "自然暖色调"
  },
  
  // 三、内容创意
  "contentCreative": {
    "narrativeMode": "dialogue",  // 叙事方式
    "contentTone": "专业但通俗易懂",
    "visualStyle": "全写实",
    "musicStyle": "轻柔背景音乐"
  },
  
  // 四、结构分镜
  "structure": {
    "opening": {
      "enabled": true,
      "title": "全民健康科普",
      "subtitle": "什么是横纹肌溶解"
    },
    "scenes": [
      {
        "id": "S01",
        "type": "introduction",
        "description": "陈卓介绍横纹肌溶解概念"
      }
      // ...
    ],
    "ending": {
      "style": "summary",
      "previewNext": false        // 不预告下一集
    }
  },
  
  // 五、系列规划
  "series": {
    "isSeries": true,
    "totalEpisodes": 3,
    "currentEpisode": 1,
    "episodeThemes": [
      "横纹肌溶解的症状以及实验室检查",
      "为什么会发生横纹肌溶解",
      "怎么处理和预防横纹肌溶解"
    ],
    "contentIsolation": true
  },
  
  // 六、特殊要求
  "constraints": {
    "singleHost": true,
    "naturalBodyLanguage": true,
    "walkingPresentation": true,
    "noMedicalMisinformation": true
  },
  
  // 七、AI决策说明（供用户确认）
  "aiDecisionNotes": {
    "videoType": "从'讲解健康知识'推断为 EDU(教育科普)",
    "style": "医疗科普需可信感→REAL，护士形象需亲和力→WARM",
    "duration": "59-65秒在30-90秒首推区间，无需拆分",
    "creativeIntensity": "用户未指定，按EDU默认0.6(艺术级)",
    "platform": "未指定，根据科普内容推荐多平台分发"
  },
  
  // 字段置信度
  "fieldConfidence": {
    "videoType": 0.95,
    "title": 1.0,
    "duration": 1.0,
    "style": 0.75,
    "creativeIntensity": 0.6
  },
  
  // 需要用户确认的低置信度字段
  "requiresConfirmation": ["style", "creativeIntensity"]
}
```

### 3.3 融合位置：Stage -1

```
[用户] 
  ↓ 自然语言输入
[Stage -1: 需求解析确认] 
  → 输出结构化需求清单
  → 用户确认/修改（可选1-2轮迭代）
  → 确认后转换为 pipeline input
  ↓ 结构化 input
[Stage 0: Mock数据清理]
[Stage 1: PRD生成] ← 此时PRD接收的是已确认的需求
  ... 现有主链路 ...
[Stage 17: 最终输出]
  ↓
[用户] 收到成品
```

---

## 四、与现有系统的兼容性策略

### 4.1 向后兼容

**场景1：用户直接提供结构化 input（现有方式）**
- 检测 input 是否已经是结构化格式（有 videoType/title 等字段）
- 如果是，跳过 Stage -1，直接进入现有链路
- 保持 100% 向后兼容

**场景2：用户说自然语言（新方式）**
- 检测 input 是字符串或简单对象
- 触发 Stage -1 解析
- 输出结构化需求清单，用户确认
- 确认后转换为 pipeline input，进入现有链路

### 4.2 字段扩展策略

```javascript
// 现有 input 对象（v6.5.66）
const input = {
  videoType: 'health_edu',
  title: '...',
  characters: [...],
  // ... 现有字段
};

// 扩展后的 input 对象（v6.6.0）
const input = {
  // 现有字段保持不变
  videoType: 'health_edu',
  title: '...',
  characters: [...],
  
  // 新增字段（从需求解析模块注入）
  platform: '视频号/抖音',        // 新增
  narrativeMode: 'dialogue',      // 新增
  visualStyle: '全写实',          // 新增
  musicStyle: '轻柔背景音乐',      // 新增
  styleModifiers: ['WARM'],       // 新增
  constraints: {
    // 现有约束...
    endingStyle: 'summary',       // 新增
  },
  
  // 元数据（不进入生产，仅用于追溯）
  _requirementParseResult: { ... }  // 原始需求解析结果快照
};
```

### 4.3 各 Stage 的字段消费

| 新增字段 | 消费 Stage | 消费方式 |
|---------|-----------|---------|
| `platform` | Stage 2 (需求对齐) | 验证平台与画幅比例一致性 |
| `narrativeMode` | Stage 5 (剧本生成) | 影响剧本生成模式（讲解/叙事/对话） |
| `visualStyle` | Stage 11 (渲染核心) | 影响视觉提示词风格描述 |
| `musicStyle` | Stage 15 (后期处理) | 影响音乐和音效推荐 |
| `styleModifiers` | Stage 11 (渲染核心) | 影响创意指数模块激活的附加模块 |
| `endingStyle` | Stage 5 (剧本生成) | 影响结尾镜的剧本生成逻辑 |

---

## 五、实现计划（分阶段）

### Phase 1: 核心模块实现（2-3小时）

1. **创建需求解析模块** `systems/user-requirement-parser.js`
   - 语义解析引擎（关键词提取、实体识别）
   - 推断补全引擎（基于规则库）
   - 约束检查引擎（系统硬约束验证）
   - 清单生成器（输出结构化 JSON）

2. **创建规则库** `systems/requirement-parser-rules.js`
   - 视频类型映射规则
   - 风格推断规则
   - 时长推断规则
   - 平台-画幅映射规则

3. **创建字段映射器** `systems/requirement-to-input-mapper.js`
   - RequirementParseResult → 现有 input 格式转换
   - 编码展开（如 REAL → "写实纪实"）

### Phase 2: 融合集成（2-3小时）

1. **修改 execute() 入口**
   - 检测输入类型（字符串/结构化）
   - 如果是字符串，触发 Stage -1 解析
   - 如果是结构化，直接进入现有链路

2. **扩展 input schema**
   - 新增字段：platform, narrativeMode, visualStyle, musicStyle, styleModifiers
   - 确保向后兼容

3. **修改各 Stage 消费新增字段**
   - Stage 2：验证平台-画幅一致性
   - Stage 5：根据 narrativeMode 调整剧本生成
   - Stage 11：根据 visualStyle 和 styleModifiers 调整渲染

### Phase 3: 测试验证（1-2小时）

1. **单元测试**：测试需求解析模块的解析准确性
2. **集成测试**：测试全链路从自然语言到输出的完整流程
3. **示例测试**：用队长提供的5个示例测试

### Phase 4: 文档与发布（1小时）

1. **更新版本号**：v6.6.0
2. **编写 Release Notes**
3. **更新 SKILL.md**：新增需求解析模块的使用说明

---

## 六、风险与应对

| 风险 | 影响 | 应对策略 |
|------|------|---------|
| 解析错误导致需求偏差 | 高 | 用户确认环节，低置信度字段标注 |
| 过度推断引发用户不满 | 中 | 所有推断标注[AI: 理由]，用户可修改 |
| 字段扩展导致现有系统不稳定 | 中 | 向后兼容，新增字段可选 |
| 自然语言理解不准确 | 中 | 规则库+LLM混合解析，多轮确认兜底 |
| 增加交互轮次降低效率 | 低 | 用户可直接提供结构化 input 跳过 |

---

## 七、设计确认点（等队长反馈）

1. **模块位置**：Stage -1（pipeline 最前端）是否合适？还是作为独立 skill 在外部调用？
2. **交互模式**：系统直接出方案 → 用户确认，还是系统出方案 + 高亮不确定项 → 用户确认/修改？
3. **LLM 依赖**：需求解析模块是否需要 LLM 调用？还是纯规则库（更快、更确定）？
4. **风格编码展开**：REAL/CINE 等编码在 Prompt 中展开为中文描述，由映射器处理还是各 Stage 自行处理？
5. **平台字段**：是否需要支持多平台同时投放（如"抖音+视频号"）？

---

**设计完成时间**：2026-06-14 08:35-09:30
**设计者**：小G（基于队长方案深化）
**待确认**：上述5个确认点
