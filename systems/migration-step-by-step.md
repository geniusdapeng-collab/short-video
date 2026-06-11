# Migration Step By Step v1

目标：
把旧的 prompt 生成链，逐步迁移到 FinalPromptBuilderV3。

---

## Step 1：新增核心文件
确保以下文件存在：

- subsystem-orchestrator-v2.js
- final-prompt-builder-v3.js
- field-mapper-v1.js
- shot-schema-validator-v1.js
- config-unifier-v1.js
- prompt-normalizer-v1.js
- prompt-trimmer-v1.js
- prompt-validator-v1.js
- negative-field-builder-v1.js
- shot-debug-recorder-v1.js

以及 bridge 文件：
- camera-movement-system-v3.bridge.js
- ambient-sound-designer.bridge.js
- beast-entrance-agent.bridge.js
- closing-shot-emotional-booster.bridge.js

---

## Step 2：找到旧主链的"最终 prompt 拼接入口"
全局搜索以下关键词：
- `prompt +=`
- `return prompt`
- `submitRender(`
- `buildPrompt`
- `generateShotPrompt`
- `renderPayload.prompt`

找到真正负责"最终给渲染引擎喂 prompt"的地方。

---

## Step 3：在旧入口外包一层
不要立刻删旧逻辑。
先替换为：

```js
const { FinalPromptBuilderV3 } = require('./systems/final-prompt-builder-v3');
const builder = new FinalPromptBuilderV3({ debug: true, llmEnabled: true });

const result = await builder.build(rawShot, context);
if (!result.success) throw new Error(result.validation.issues.join('; '));
return result.prompt;
```

---

## Step 4：先只让 opening / reveal / climax 走新链
如果担心风险，可以加条件：

```js
const type = (rawShot.type || '').toLowerCase();
const useNewChain =
  type.includes('opening') ||
  type.includes('reveal') ||
  type.includes('climax');

if (useNewChain) {
  const result = await builder.build(rawShot, context);
  return result.prompt;
} else {
  return oldPrompt;
}
```

---

## Step 5：开启 debug-shot-records
确认每个镜头都能产出对应 json。

重点检查：
- rawShot
- mappedShot
- subsystemFields
- llmFields
- finalPrompt
- validation

---

## Step 6：跑回归测试
执行：

```bash
node systems/prompt-regression-test-v1.js
```

必须确认：
- total = 3
- failed = 0
- closing 镜头 boosted = true
- debugExists = true

---

## Step 7：逐步扩大覆盖范围
从：
- opening / climax / closing

扩大到：
- reveal / interaction / explanation

最后再覆盖全片。

---

# 不要做的事

1. 不要一次删除所有旧逻辑
2. 不要所有镜头一次切到新链
3. 不要继续在模块内部 `prompt +=`
4. 不要让 camera / sound / beast 模块直接返回最终 prompt
