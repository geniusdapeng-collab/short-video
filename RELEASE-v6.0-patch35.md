# 生产版本发布记录 v6.0-patch35

**发布日期**: 2026-05-26  
**系统名称**: Seedance视频生成统一平台  
**前一版本**: v6.0-patch34（StoryCraft v2.0 主链路激活）  
**发布原因**: 定妆照保障机制双系列通用化 + 逆向安全审计漏洞修复

---

## 🚨 修复内容

### 1. 新增：PortraitGuard 定妆照统一硬拦截系统 v1.0

**文件**: `systems/portrait-guard.js`  
**目标**: 双系列通用（山海经 + 通用视频）

**核心能力**:
- 动态扫描 `characters/` 目录，自动发现所有角色
- 验证 content 数组中的 `reference_image`（4角度覆盖）
- 生产模式：硬拦截（抛出错误终止提交）
- 预生产模式：仅警告
- 独立闸机入口 `validateOrThrow()`，任何提交脚本可调用

**使用方式**:
```javascript
const { PortraitGuard } = require('../systems/portrait-guard.js');
const guard = new PortraitGuard({ mode: 'production' });
guard.validateOrThrow(shots); // 不通过直接抛出错误
```

### 2. 修复：submit-production-render.js（山海经系列提交脚本）

**漏洞**: 硬编码 `CHARACTER_PORTRAITS` 只配置了"小G"，新增角色无定妆照  
**漏洞**: 依赖不存在的 `humanCharacters` / `beastMentioned` 字段  
**漏洞**: 脚本自身无硬拦截，绕过Pipeline直接运行会漏传定妆照

**修复**:
- 删除硬编码 `CHARACTER_PORTRAITS`
- 改用 `PortraitGuard.buildReferenceImages()` 动态扫描
- 从 `shot.characters` 推断人类角色（排除神兽）
- 提交前调用 `PortraitGuard.quickCheck()` 实时硬拦截
- 0张参考图 = 终止提交

### 3. 修复：render-v5-mandatory-ratio.js（通用视频系列提交脚本）

**漏洞**: 读取 `character-card.json` 的 `generatedAssets.referenceImages` 可能为空数组  
**漏洞**: 输出"参考图: 0张"后继续提交，无硬拦截

**修复**:
- 导入 `PortraitGuard`
- `submitTask()` 增加 `characters` 参数
- 构建 content 数组后调用 `PortraitGuard.quickCheck()`
- 0张 reference_image 且含角色 → `reject()` 终止Promise

### 4. 保留：submit-taotie-render.js（已有独立硬拦截）

该脚本已有自己的多角色全角度硬拦截逻辑（v2.0），暂不改动。后续统一迁移到 PortraitGuard。

---

## 📊 修复前后对比

| 保障层级 | 修复前 | 修复后 |
|---------|--------|--------|
| **Pipeline Stage-13** | ✅ ReferenceImageGate | ✅ ReferenceImageGate（不变） |
| **山海经submit脚本** | ❌ 无硬拦截 | ✅ PortraitGuard.quickCheck |
| **通用视频submit脚本** | ❌ 无硬拦截 | ✅ PortraitGuard.quickCheck |
| **角色读取方式** | ❌ 硬编码 | ✅ 动态扫描 |
| **字段依赖** | ❌ 依赖不存在字段 | ✅ 从 shot.characters 推断 |
| **新增角色支持** | ❌ 需手动改代码 | ✅ 自动扫描目录 |

---

## 🧪 测试验证

**待执行**:
1. Mock测试 PortraitGuard 独立模块
2. Mock测试 submit-production-render.js（不带API Key）
3. Mock测试 render-v5-mandatory-ratio.js（不带API Key）
4. 验证：0张参考图时是否正确拦截
5. 验证：参考图齐全时是否通过

---

## ⚠️ 已知限制

1. **神兽角色无图片定妆照**：仍依赖Prompt级增强（`BEAST_VISUAL_SIGNATURES`），这是API限制导致的，非系统漏洞
2. **submit-taotie-render.js 未统一**：已有独立硬拦截，后续版本统一迁移到 PortraitGuard
3. **角度选择策略**：当前按 shotType 选择最优角度（closeup/front/threeQuarter），非全4角度传入

---

## 📁 变更文件清单

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `systems/portrait-guard.js` | 新增 | 双系列通用定妆照硬拦截系统 |
| `scripts/submit-production-render.js` | 修改 | 删除硬编码，改用PortraitGuard |
| `stories/rhabdomyolysis-s01e01/scripts/render-v5-mandatory-ratio.js` | 修改 | 增加PortraitGuard硬拦截 |
| `SYSTEM.md` | 修改 | 版本号更新 |

---

## 🎯 下一步行动

1. 执行Mock测试验证（队长确认后立即执行）
2. 测试通过后提交生产发布
3. 后续将 `submit-taotie-render.js` 统一迁移到 PortraitGuard
4. 考虑将 `ReferenceImageGate`（Pipeline内）与 `PortraitGuard`（独立）合并为单一模块

---

*"宁可报告失败，不可伪造成功。"* — v6.0-patch35
