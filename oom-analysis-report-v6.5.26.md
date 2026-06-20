# OOM问题深度分析报告 v6.5.26

> 系统：Nirath视频生成系统  
> 问题：健康科普预生产Stage 5 OOM/进程终止  
> 日期：2026-06-08  
> 报告人：小G  
> 版本：v6.5.26（含内存监控）

---

## 1. 问题概述

### 1.1 现象描述
在运行健康科普视频（横纹肌溶解EP01）预生产时，Stage 5（LLM剧本生成）出现以下异常：
- **情况A**：V8堆内存溢出（`FATAL ERROR: Ineffective mark-compacts near heap limit`）
- **情况B**：进程被系统SIGKILL（系统OOM杀手）
- **情况C**：进程被SIGTERM（原因不明）

### 1.2 关键对比
| 维度 | v6.5.11（成功案例） | v6.5.26（失败案例） |
|------|---------------------|---------------------|
| **场景** | Nirath/山海经（饕餮EP01） | 健康科普（横纹肌溶解） |
| **世界观** | 外星生态星球 | 现代医疗科普 |
| **角色** | xiaoG, taotie | chen-nurse, xiaoG, coach-li |
| **镜头数** | 6镜 | 5镜 |
| **batchSize** | 1（6批次） | 2（3批次） |
| **maxTokens** | 32000 | 3000 |
| **LLM输出** | Tokens 5535，content=992字符 ✅ | Tokens 3000，content=空 ❌ |
| **reasoning_content** | 未记录（但content正常） | 6208字符 |
| **内存结果** | 无OOM ✅ | 被终止 ❌ |
| **运行方式** | `node run-taotie-preproduction.js` | `node --expose-gc run-health-edu-preproduction.js` |

---

## 2. 系统环境

```
OS: Linux 6.8.0-71-generic (x64)
Node.js: v24.15.0
物理内存: 7.5 GB
CPU: 8 cores
OpenClaw: VM-38-151-ubuntu
模型: kimi-k2p6（Kimi推理模型）
API端点: https://agent-gw.kimi.com/coding/v1/chat/completions
```

### 2.1 内存限制
- **系统总内存**: 7.5 GB
- **Node.js堆默认大小**: ~1.4 GB（64位系统）
- **已尝试的堆设置**: 6144MB → 4096MB → 不设置（默认）→ 均失败

---

## 3. 期望结果

1. **Stage 5正常完成**: 5个镜头的剧本全部生成，每个镜头有有效的`dialogue`和`narration`
2. **JSON解析成功**: LLM返回有效的JSON格式，包含`scenes`数组
3. **内存稳定**: 整个预生产过程不触发OOM，总内存使用 < 4GB
4. **完整链路**: Stage 5完成后，继续运行Stage 6+直至完成

---

## 4. 实际现象与日志

### 4.1 最新运行日志（v6.5.26，含内存监控）

```
[MEM] Stage 5 start | heapUsed=14.1MB

[STAGE-5] 📝 批次 1/3 | 镜数: 2 | Prompt: 1315字符
[LLMEngine] ✅ API 推理完成 | Tokens: 3000
[LLMEngine] 📥 输出长度: 2000 字符
[STAGE-5] ⚠️ 批次 1 失败: JSON parse error: Expected property name or '}' in JSON
[MEM] 批次 1 后 | heapUsed=15.2MB | rss=85.5MB

[STAGE-5] 📝 批次 2/3 | 镜数: 2 | Prompt: 1308字符
[LLMEngine] ✅ API 推理完成 | Tokens: 3000
[LLMEngine] 📥 输出长度: 2000 字符
[STAGE-5] ⚠️ 批次 2 失败: JSON parse error: Unexpected non-whitespace character after JSON
[MEM] 批次 2 后 | heapUsed=15.5MB | rss=85.5MB

[STAGE-5] 📝 批次 3/3 | 镜数: 1 | Prompt: 1175字符
[LLMEngine] ❌ JSON 解析失败: Unexpected non-whitespace character after JSON
... Process exited with signal SIGTERM
```

### 4.2 关键发现：内存监控正常
- **Stage 5开始时**: heapUsed=14.1MB
- **批次1后**: heapUsed=15.2MB, rss=85.5MB
- **批次2后**: heapUsed=15.5MB, rss=85.5MB

**结论**: JavaScript堆内存使用完全正常（仅15MB），远未达到OOM阈值。

### 4.3 历史OOM日志（V8堆溢出）

```
<--- Last few GCs --->
[3891073:0x2d389000]   370687 ms: Scavenge 2038.2 (2043.2) -> 2038.2 (2054.2) MB
[3891073:0x2d389000]   373213 ms: Mark-Compact 2038.4 (2054.2) -> 2038.4 (2040.5) MB
FATAL ERROR: Ineffective mark-compacts near heap limit
Allocation failed - JavaScript heap out of memory
```

**注意**: 此日志来自早期版本（v6.5.18-6.5.25），当时堆设置为6144MB。当前版本（v6.5.26）已无此问题。

---

## 5. 代码分析

### 5.1 LLM调用入口（_llmGenerateScript）

```javascript
// systems/nirath-master-pipeline.js
async _llmGenerateScript(input, prd) {
  const { LLMEngine } = require('./llm-reasoning-engine');
  const llm = new LLMEngine({ 
    model: 'kimi-k2p6', 
    mode: 'production', 
    maxRetries: 2, 
    maxTokens: 3000  // v6.5.23: 从32000降至3000
  });

  const scenes = input.scenes || [];
  const batchSize = 2;  // v6.5.24: 从1改为2
  const batches = [];
  for (let i = 0; i < scenes.length; i += batchSize) {
    batches.push(scenes.slice(i, i + batchSize));
  }

  const batchResults = [];
  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx];
    const prompt = this._buildScriptPrompt(batch, core, world, batchIdx, batches.length);
    
    const result = await llm.reasonStructured(prompt, {
      scenes: [],
      narrative: { emotion: 'neutral', pace: 'medium', totalDuration: 60 },
      world: { name: 'Nirath', setting: '外星生态星球' }
    });
    
    // 处理结果...
    if (result.success && result.data?.scenes) {
      batchResults.push({ batchIdx, scenes: batchScenes, success: true });
    } else {
      batchResults.push({ batchIdx, scenes: fallbackScenes, success: false });
    }
    
    // 内存释放
    if (global.gc) { global.gc(); }
  }
}
```

### 5.2 LLM引擎（llm-reasoning-engine.js）

```javascript
class LLMEngine {
  constructor(options = {}) {
    this.model = options.model || 'kimi-k2p6';
    this.maxTokens = options.maxTokens || 2000;  // v6.5.20: 默认2000
    this.timeoutMs = options.timeoutMs || 600000;
    this.temperature = 1;
    this.topP = 0.95;
    this.maxRetries = options.maxRetries || 3;
    this.contextWindow = 8192;
    this.conversationHistory = [];
    this.stats = { totalCalls: 0, totalTokens: 0, totalDuration: 0, errors: 0 };
    this.mode = options.mode || 'production';
  }
}
```

### 5.3 API调用与content处理（关键代码）

```javascript
async reason(prompt, options = {}) {
  const response = await fetch(url, { ... });
  const result = await response.json();
  
  const content = result.choices?.[0]?.message?.content || '';
  const reasoningContent = result.choices?.[0]?.message?.reasoning_content || '';
  
  let finalContent = content;
  let finalReasoning = reasoningContent;
  
  if (!finalContent || finalContent.trim().length === 0) {
    if (reasoningContent && reasoningContent.trim().length > 0) {
      console.log(`[LLMEngine] 🧠 content为空，但reasoning_content有${reasoningContent.length}字符`);
      // v6.5.22-fix: 从reasoning_content提取最后2000字符作为content备用
      finalContent = reasoningContent.slice(-2000);
    } else {
      throw new Error('API返回空内容');
    }
  }
  
  return { content: finalContent, reasoning_content: finalReasoning, tokenCount, ... };
}
```

### 5.4 JSON解析（reasonStructured）

```javascript
async reasonStructured(prompt, schema, options = {}) {
  const structuredPrompt = `${prompt}\n\n【输出格式要求】\n请严格按以下 JSON 格式输出...`;
  const result = await this.reason(structuredPrompt, options);
  
  if (!result.success) return { success: false, error: result.error };
  
  try {
    let jsonStr = result.content;
    
    // 步骤1：markdown代码块提取
    const codeBlockMatch = result.content.match(/```json\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) jsonStr = codeBlockMatch[1];
    
    // 步骤2：找第一个 { 和最后一个 }
    const firstBrace = result.content.indexOf('{');
    const lastBrace = result.content.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      jsonStr = result.content.substring(firstBrace, lastBrace + 1);
    }
    
    // 步骤3：从思维链提取JSON
    let parsed = null;
    try {
      parsed = JSON.parse(jsonStr.trim());
    } catch (e1) {
      const extracted = extractJSONFromReasoning(result.content);
      if (extracted) {
        jsonStr = extracted;
        parsed = JSON.parse(jsonStr.trim());
      }
    }
    
    return { success: true, data: parsed, rawContent: result.content };
  } catch (parseError) {
    return { success: false, error: `JSON parse error: ${parseError.message}` };
  }
}
```

---

## 6. 根因假设

### 假设1：LLM content为空（已验证）
**状态**: ✅ 确认
- **现象**: LLM返回`content`为空，`reasoning_content`有6208字符
- **原因**: `maxTokens=3000`太小，LLM消耗所有tokens进行思考，无剩余tokens输出content
- **证据**: 
  - `[LLMEngine] 🧠 content为空，但reasoning_content有6208字符`
  - `[LLMEngine] ✅ API 推理完成 | Tokens: 3000`（全部用于reasoning）

### 假设2：JSON解析失败（已验证）
**状态**: ✅ 确认
- **现象**: 从`reasoning_content`提取的最后2000字符不是有效的JSON
- **原因**: `reasoning_content`是思维过程文本，不是JSON格式
- **证据**:
  - `JSON parse error: Expected property name or '}' in JSON at position 1`
  - 提取内容：`手交叉于胸前，头部微微侧向陈护士...`（描述性文本，非JSON）

### 假设3：内存泄漏（已排除）
**状态**: ❌ 排除
- **现象**: 历史运行中V8堆达到2040MB后溢出
- **最新证据**: v6.5.26内存监控显示heapUsed=15.2MB（正常）
- **结论**: 当前版本无内存泄漏，历史OOM可能是由其他原因引起（如系统OOM杀手、堆设置不当）

### 假设4：进程被SIGTERM（待查）
**状态**: 🔍 待查
- **现象**: 最新运行被`SIGTERM`终止，不是OOM
- **可能原因**:
  1. 系统cgroup限制（如Docker容器内存限制）
  2. 系统定时任务（如cron job）发送信号
  3. OpenClaw exec超时（但设置600秒，进程仅运行2分37秒）
  4. 系统资源限制（如systemd的TimeoutStartSec）
  5. 其他进程发送信号

### 假设5：v6.5.11成功的原因（推测）
**状态**: 🔍 推测
- **Nirath场景prompt更简洁**: 外星生态场景描述更抽象，不需要大量医学细节
- **LLM输出模式不同**: v6.5.11的LLM直接输出JSON（content=992字符），而不是先思考再输出
- **Prompt结构差异**: v6.5.11的`_buildScriptPrompt`可能更简洁，触发LLM直接输出模式

---

## 7. 关键差异：v6.5.11 vs v6.5.26

### 7.1 Prompt长度对比
| 场景 | Prompt长度 | 内容特点 |
|------|-----------|---------|
| **Nirath（v6.5.11）** | ~500-600字符 | 场景描述抽象，角色简单（xiaoG+taotie） |
| **健康科普（v6.5.26）** | ~1300-1550字符 | 医学术语多，角色复杂（3角色+动作描述） |

### 7.2 LLM输出模式对比
| 维度 | v6.5.11 | v6.5.26 |
|------|---------|---------|
| **content** | 有内容（992字符）✅ | 空 ❌ |
| **reasoning_content** | 未记录（但content正常） | 6208字符 |
| **输出格式** | 有效JSON ✅ | 无效JSON（描述文本） ❌ |
| **tokens使用** | 5535（含content） | 3000（全用于reasoning） |

### 7.3 运行环境对比
| 维度 | v6.5.11 | v6.5.26 |
|------|---------|---------|
| **运行命令** | `node run-taotie-preproduction.js` | `node --expose-gc run-health-edu-preproduction.js` |
| **max-old-space-size** | 未设置（默认~1.4GB） | 已尝试：6144→4096→不设置 |
| **堆外内存** | 未知 | 监控显示rss=85.5MB（正常） |

---

## 8. 需要外部专家协助

### 8.1 核心问题
1. **LLM content为空**: 为什么`maxTokens=3000`时，LLM仍不输出content？
   - 是prompt结构问题？
   - 是模型特性（kimi-k2p6推理模式）？
   - 需要增加maxTokens到4000+？

2. **JSON解析失败**: 从`reasoning_content`提取的文本不是JSON，如何确保LLM输出有效JSON？
   - 需要修改prompt，强制LLM直接输出JSON？
   - 需要修改API参数（如`response_format={"type": "json_object"}`）？
   - 需要调整temperature/top_p？

3. **SIGTERM原因**: 进程被SIGTERM终止，不是OOM，原因是什么？
   - 系统cgroup限制？
   - OpenClaw执行环境限制？
   - 需要检查系统日志（`dmesg`、`journalctl`）？

### 8.2 期望的解决方案
1. **确保LLM输出有效JSON**: 修改prompt或API参数，使LLM直接输出JSON（而不是先思考）
2. **内存稳定**: 确保预生产过程不触发OOM或SIGTERM
3. **通用性**: 解决方案应适用于所有场景（Nirath和健康科普），不是单case定制

### 8.3 提供的材料
- 本报告（含完整代码和日志）
- `llm-reasoning-engine.js`（完整代码）
- `nirath-master-pipeline.js`（Stage 5相关代码）
- `run-health-edu-preproduction.js`（启动器）
- v6.5.11成功案例的对比数据

---

## 9. 附录：完整代码片段

### 9.1 LLM Prompt构建（_buildScriptPrompt）
```javascript
_buildScriptPrompt(batch, core, world, batchIdx, totalBatches) {
  const parts = [];
  parts.push(`你是一位专业的剧本生成Agent。请为以下场景生成剧本内容。`);
  parts.push(`\n【世界观】${world.name || 'Nirath'} | ${world.setting || '外星生态星球'}`);
  parts.push(`\n【当前批次】${batchIdx + 1}/${totalBatches}`);
  parts.push(`\n【场景列表】`);
  
  batch.forEach((scene, idx) => {
    parts.push(`\n场景 ${idx + 1}:`);
    parts.push(`- ID: ${scene.id}`);
    parts.push(`- 名称: ${scene.name || '未命名'}`);
    parts.push(`- 类型: ${scene.type || 'explanation'}`);
    parts.push(`- 时长: ${scene.duration || 10}秒`);
    parts.push(`- 描述: ${scene.description || '无描述'}`);
    parts.push(`- 角色: ${(scene.characters || []).join(', ') || '无'}`);
  });
  
  parts.push(`\n【输出要求】`);
  parts.push(`请为每个场景生成：`);
  parts.push(`1. dialogue: 角色台词（中文，口语化，符合角色性格）`);
  parts.push(`2. narration: 旁白/解说词（如有需要）`);
  parts.push(`3. visualPrompt: 视觉描述（300-500字，用于视频生成）`);
  parts.push(`4. mouthAction: 口型动作（speaking_normal / speaking_whisper / speaking_emphasis）`);
  parts.push(`5. emotionPhase: 情感阶段（curiosity / tension / climax / resolution）`);
  parts.push(`\n【格式要求】`);
  parts.push(`请严格按JSON格式输出，不要包含任何其他内容。`);
  parts.push(`每个场景必须包含：id, scene, dialogue, narration, visualPrompt, mouthAction, emotionPhase`);
  
  return parts.join('\n');
}
```

### 9.2 健康科普场景输入（run-health-edu-preproduction.js）
```javascript
const input = {
  projectName: 'rhabdomyolysis-ep01',
  videoType: 'health-education',
  targetDuration: 62,
  style: '超写实纪录片风格，真实医疗科普场景，自然光，专业医疗环境',
  mode: 'generic',
  
  scenes: [
    {
      id: 'S01',
      name: '开场介绍',
      type: 'establishing',
      duration: 12,
      description: '陈女士开场自我介绍，介绍今天的主题——横纹肌溶解'
    },
    {
      id: 'S02',
      name: '症状讲解',
      type: 'explanation',
      duration: 18,
      description: '讲解横纹肌溶解的三大典型症状：肌肉疼痛/无力/肿胀、茶色尿/酱油色尿、全身乏力'
    },
    {
      id: 'S03',
      name: '实验室检查',
      type: 'explanation',
      duration: 18,
      description: '讲解关键实验室检查指标：肌酸激酶CK值、肌红蛋白、肾功能指标'
    },
    {
      id: 'S04',
      name: '案例展示',
      type: 'demonstration',
      duration: 10,
      description: '李明教练作为模特展示肌肉检查动作，小G在旁聆听互动'
    },
    {
      id: 'S05',
      name: '总结强调',
      type: 'closing',
      duration: 4,
      description: '陈女士总结第一集要点，强调出现症状及时就医'
    }
  ],
  
  characters: {
    'chen-nurse': { id: 'chen-nurse', name: '陈女士', role: 'host', ... },
    'xiaoG': { id: 'xiaoG', name: '小G', role: 'audience', ... },
    'coach-li': { id: 'coach-li', name: '李明教练', role: 'model', ... }
  }
};
```

---

## 10. 总结

### 10.1 已确认的问题
1. **LLM content为空**: `maxTokens=3000`时，LLM将3000 tokens全部用于`reasoning_content`（6208字符），不输出`content`
2. **JSON解析失败**: 从`reasoning_content`提取的文本不是有效的JSON，导致解析失败
3. **内存监控正常**: v6.5.26的内存监控显示heapUsed=15MB（正常），OOM问题可能是历史问题或系统级问题

### 10.2 待确认的问题
1. **SIGTERM原因**: 进程被SIGTERM终止，原因不明（可能是系统限制、OpenClaw环境限制等）
2. **v6.5.11成功机制**: v6.5.11的LLM为什么能直接输出content（992字符），而不是空content？

### 10.3 需要专家解答
1. 如何修改prompt或API参数，确保LLM直接输出JSON（而不是先思考）？
2. 如何调整`maxTokens`或其他参数，平衡输出大小和内存使用？
3. 系统级内存限制（SIGTERM/SIGKILL）的根源是什么？

---

*报告生成时间: 2026-06-08 18:02 GMT+8*  
*系统版本: v6.5.26*  
*联系方式: 小G（OpenClaw助手）*
