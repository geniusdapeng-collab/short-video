# v6.2-patch87-3 PRODUCTION 发布说明

## 发布日期
2026-05-31 21:07 (Asia/Shanghai)

## 版本标签
`v6.2-patch87-3-PRODUCTION` (commit: 2db62d0)

## 核心优化：Prompt 角色描述精简 + 核心视觉锚点保留

### 问题背景
- 视频渲染 Prompt 中角色描述占用 100-200 字符，浪费空间
- 但 API 靠视觉理解"猜"参考图对应关系，不能极简到只剩名字
- 需要保留核心视觉锚点，让 LLM 能匹配参考图

### 解决方案
保留名字 + 2-3 个核心视觉特征（30-40 字符），省略完整外貌描述

### 修改文件
| 文件 | 修改内容 |
|------|----------|
| `systems/character-prompt-builder.js` | 新增 `buildMinimal()` 方法：名字+核心视觉特征 |
| `shanhaijing-render-engine/orient-primordial-core-v24.js` | `buildPromptV3` 新增 `characterProfiles` 参数，6个描述方法统一使用精简角色描述 |
| `systems/nirath-master-pipeline.js` | Stage 11 注入精简角色描述，从 `stages.characters` 获取档案并调用 `buildMinimal` |
| `systems/prompt-standard-v2.js` | CHARACTER 字段 `targetLength` 从 140 → 30 |

### 效果
- 角色描述从 100-200 字符 → 30-40 字符
- 节省 60-170 字符给环境/材质/运镜细节
- 保留核心视觉锚点（如 `短发东亚少年`、`黑曜石肤质`）让 LLM 匹配参考图

### 输出示例
```
小G(短发东亚少年，黑曜石肤质) 饕餮(巨兽，角如熔岩，羊身人面)
```

### 向后兼容
- `characterProfiles` 为空时 fallback 到原有行为（`characters.join`）
- 所有修改通过 `node --check` 语法验证

## 验证状态
- ✅ 语法检查通过（4个文件全部通过）
- ✅ Git 提交成功（2db62d0）
- ✅ 生产标签已打（v6.2-patch87-3-PRODUCTION）
