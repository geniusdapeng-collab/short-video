# Release v6.2-patch41 — 定妆照闸机硬拦截 + 5维评分公式

**发布日期**: 2026-05-27
**版本**: v6.2-patch41
**状态**: 生产就绪

---

## 🔴 P0修复：定妆照闸机彻底加固

**问题**: 6个渲染脚本中，4个存在"定妆照缺失仅警告不中止"漏洞，导致历史S00/S01未绑定饕餮定妆照。

**修复文件**:
| 文件 | 修复前 | 修复后 |
|------|--------|--------|
| `scripts/submit-s00-s01-render.js` | `continue`跳过 | `throw Error`硬拦截 |
| `scripts/submit-taotie-render-v2.js` | 错误路径+无拦截 | 正确路径+`throw Error` |
| `scripts/submit-taotie-render.js` | `continue`跳过 | `throw Error`硬拦截 |
| `scripts/submit-jiuwei-render.js` | `return null` | `throw Error`硬拦截 |
| `scripts/submit-production-render.js` | 神兽不绑图片 | 全部角色绑定图片 |
| `scripts/render-submitter-core.js` | 不存在（新建） | 统一渲染核心模块 |

**统一核心模块**: `render-submitter-core.js`
- 绑定清单驱动（binding-manifest.json）
- 文件物理存在检查
- content数组强制绑定
- API响应验证
- 任意失败=throw Error

---

## 📊 评分公式升级：5维模型

**修改文件**: `systems/nirath-master-pipeline.js`

| 维度 | 权重 | 满分标准 |
|------|------|----------|
| 运镜变化丰富度 | 30分 | 4段=30 |
| 光影情绪递进 | 15分 | 有递进=15 |
| 叙事情绪深度 | 20分 | narration+台词+情绪词 |
| Prompt空间利用 | 15分 | 980字符=15 |
| 叙事画面对齐 | **20分** | 台词与画面匹配 |
| **总计** | **100分** | |

**新增方法**:
- `calculateEmotionalDepthV2()` — 基于narration+beastLines+情绪词
- `calculateNarrativeAlignment()` — narration关键词在prompt匹配度

**S01实测**: 30+15+9+15+18 = **87分**（旧公式虚假70/100→100）

---

## 🧪 验证结果

- 全部7个文件语法验证通过（node -c）
- 定妆照加载测试：8/8张全部成功
- 评分公式Mock测试：S01=87分，S00=95分

---

## ⚠️ 已知待改进

1. **神兽Prompt增强**: `submit-production-render.js` 仍保留Prompt级神兽特征增强，未来统一为核心模块职责
2. **统一核心模块整合**: 现有脚本仍独立工作，未来全部迁移至 `render-submitter-core.js`

---

## 提交人: 小G (小叶紫檀)
## 审核: 李大鹏 (队长)
