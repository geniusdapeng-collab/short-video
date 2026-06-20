# CHANGELOG — 超短裙系统

## SHORT-VIDEO-0.8.7 — 2026-06-20（最新）

### 核心升级：定妆照系统 + Seedance 2.0 行业专家报告整合

#### 新增：PromptGuardian 自动修复系统（来自超现实系统 v2.1.2）
- **文件**: `scripts/prompt-guardian.js`
- **功能**: 在 Prompt 生成阶段自动修复内容
- **自动修复项**:
  1. ✅ 服装锁定：自动添加"穿警服的/穿护士服的/穿白大褂的"前缀
  2. ✅ 外观锚定：自动添加"佩戴警帽、警徽、肩章"等配饰描述
  3. ✅ 引用格式修正：@imageN → 图片N（符合官方规范）
  4. ✅ 台词净化：移除竖杠 | 替换为逗号
  5. ✅ 敏感词过滤：痛苦→不适、受伤→受影响、血汗→体液
  6. ✅ 声音描述检测：【音效】【环境音】【配乐】标记
  7. ✅ 多镜头时间戳检测：[00:00-00:04] 分镜格式
  8. ✅ 负向提示词检测：【负向】标记
  9. ✅ 种子值检查：批量生成时建议锁定 seed
- **集成位置**: 
  - `short-video-engine.js` 的 `expandPrompt()` 函数末尾
  - `short-video-engine.js` 的 `expandPromptWithProduct()` 函数末尾

#### 新增：RenderPipelineGuard 强制检查系统（来自超现实系统 v2.1.2）
- **文件**: `scripts/render-pipeline-guard.js`
- **功能**: 13 项强制检查（备用，当超短裙系统直接调 API 时使用）
- **集成位置**: `systems/preproduction-service.js` 的报告生成阶段

#### 修改：short-video-engine.js
- 【v0.8.7-fix】集成 PromptGuardian 自动修复到 `expandPrompt()`
- 【v0.8.7-fix】集成 PromptGuardian 自动修复到 `expandPromptWithProduct()`
- 所有生成的 Prompt 在截断后自动经过防护检查

#### 修改：systems/preproduction-service.js
- 【v0.8.7-fix】预生产报告新增 "PromptGuardian 防护检查" 章节
- 自动检测敏感词、台词格式、引用格式问题
- 在报告中显示防护检查结果

#### 经验来源
- 横纹肌溶解科普 EP02 调试经验（超现实系统 v2.1.2）
- 行业专业人士经验包
- 外部专家深度报告（Seedance 2.0 API 视频渲染最佳实践）

---

## SHORT-VIDEO-0.8.6 — 2026-06-11

### 功能
- 极限运动镜头库 (Xtreme Shot Library)
- 商品主角引擎 (Product Hero Engine)
- Prompt 扩充引擎：85字符→1500字符
- 社媒营销短片生成
- 角色一致性管理

---
