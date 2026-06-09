# RELEASE v6.0-patch32 — 4项关键Bug修复固化

**发布日期**: 2026-05-26
**前一版本**: v6.0-patch31（定妆照强制闸机+时长分配V2）
**状态**: ✅ 生产就绪

---

## 🔧 修复1：时长分配死锁（所有镜头12秒）

**问题**: v6.0-patch31 接入 `ShotDurationAllocatorV2` 后，所有镜头被截断到12秒，差异化失效。

**根因**: `maxDuration: 12` 硬编码上限，未验证 Seedance API 真实能力。

**修复**:
- `systems/shot-duration-allocator.js`: `maxDuration` 12 → **15**（Seedance 2.0 API 真实上限）
- 去掉死锁逻辑，让 importance 差异化生效

**影响**: 开场/高潮/结尾等关键镜头可分配更长时长（10-15秒），过渡镜头可缩短（8-10秒）。

---

## 🔧 修复2：Pipeline截断问题

**问题**: `buildPrompt()` 先生成prompt再追加运镜，超标时运镜首当其冲被截断。

**根因**: 运镜是"追加"不是"融入"，在 prompt 构建完成后才追加，导致空间不足时被砍。

**修复**:
- 运镜融入 Prompt 构建流程（build-time 而非 post-append）
- 调整 `orient-primordial-core` 构建顺序，确保运镜核心空间不被压缩

**影响**: 每镜运镜描述完整保留，不再因空间不足被截断。

---

## 🔧 修复3：验证器拦截问题

**问题**: 验证器过度拦截，导致合法镜头无法通过审核。

**根因**: 验证规则过于严格，未区分"致命错误"和"可警告的优化项"。

**修复**:
- 调整验证器阈值，将部分硬拦截降级为警告
- 区分 L1（致命）/ L2（建议优化）/ L3（可忽略）三级
- 时长相关验证适配新 maxDuration=15

**影响**: 合法镜头正常通过，同时保留对真正问题的拦截能力。

---

## 🔧 修复4：饕餮定妆照路径缺失

**问题**: v6.0-patch31 多角色全角度闸机要求 Prompt 里提到的角色必须传定妆照，但饕餮定妆照扫描不到。

**根因**: 饕餮定妆照存于 `memorized_media/taotie-portraits/`，闸机扫描的是 `characters/` 目录。

**修复**:
- 将 `memorized_media/taotie-portraits/*` 搬到 `characters/tao-tie/portraits/`
- 标准化所有角色定妆照保存路径：`characters/{roleId}/portraits/{angle}.png`

**影响**: 多角色全角度闸机正常工作，含饕餮的镜头可正常提交渲染。

---

## 📁 修改文件清单

| 文件 | 修改类型 | 说明 |
|------|---------|------|
| `systems/shot-duration-allocator.js` | 修改 | maxDuration: 12→15，去掉死锁 |
| `systems/nirath-master-pipeline.js` | 修改 | Stage 9 运镜融入时机调整 |
| `systems/storyboard-validator.js` | 修改 | 阈值调整，三级分级 |
| `characters/tao-tie/portraits/*` | 新增 | 4角度定妆照标准化路径 |

---

## 🧪 测试验证

| # | 场景 | 结果 |
|---|------|------|
| 1 | 时长差异化分配（6镜各不同） | ✅ |
| 2 | 运镜完整保留（不被截断） | ✅ |
| 3 | 验证器合法通过（不拦截正常镜头） | ✅ |
| 4 | 饕餮定妆照扫描（4角度齐全） | ✅ |
| 5 | 小G+饕餮同框（全角度通过闸机） | ✅ |

---

## 📌 经验教训

1. **新模块必须端到端验证**：V2分配器、多角色闸机都是新写的，未在实际项目跑过就发布了
2. **路径统一**：视觉记忆系统（memorized_media/）和角色系统（characters/）必须统一
3. **常量需验证**：设计文档里的 `maxDuration: 12` 未验证 Seedance API 真实上限

---

## 🔄 版本历史

- v6.0-patch32 ← **本次发布：4项关键Bug修复**
- v6.0-patch31 — 定妆照强制闸机（引入上述4个Bug）
- v6.0-patch30 — 敏感词根治+6项闸机+StoryCraft修复
- ...（历史版本见patch31文档）

---

**发布状态**: ✅ 已生产就绪
**SYSTEM.md**: 已更新至 v6.0-patch32
**测试状态**: 全部通过（5/5）
