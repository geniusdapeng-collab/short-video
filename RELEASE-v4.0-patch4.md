# v4.0-patch4 生产发布

## 版本信息
- **版本号**: v4.0-patch4
- **发布日期**: 2026-05-21
- **类型**: 紧急修复（Bugfix）
- **前置版本**: v4.0-patch3

---

## 修复内容

### 🔴 严重Bug：视频比例错误（竖屏→横屏）
**问题描述**：
`render-direct-api.js` 提交Seedance 2.0 API时，**未传递`ratio`和`duration`参数**，导致API默认输出竖屏格式（720×1280），而非预期的横屏16:9。

**影响范围**：
- 横纹肌溶解EP01全部12个镜头渲染为竖屏
- 合并后的成片为720×1280竖屏
- 违反系统设计的横屏输出规范

**根因分析**：
```javascript
// ❌ 错误（patch3及之前）
const payload = {
  model: ENDPOINT,
  content: content,
  metadata: { max_new_tokens: 8192, seed: seed }
  // 漏掉了 ratio 和 duration！
};

// ✅ 修复后（patch4）
const payload = {
  model: ENDPOINT,
  content: content,
  metadata: { max_new_tokens: 8192, seed: seed },
  ratio: "16:9",        // ← 新增：强制横屏
  duration: duration    // ← 新增：镜头时长
};
```

**修复文件**：
- `scripts/render-direct-api.js` — 第89-95行，payload添加`ratio: "16:9"`和`duration`

---

## 测试验证

### Mock测试结果 ✅
```
📋 测试1: API Payload结构验证 — 12/12 通过
📐 测试2: 横屏比例强制检查 — ✅ ratio=16:9
⏱️  测试3: 时长合理性 — 12/12 通过
📝 测试4: Prompt字数合规 — 12/12 通过
🖼️ 测试5: 参考图角色分配 — 12/12 通过
🔍 测试6: Content数组结构 — ✅

总计: 6/6 项测试通过 🎉
```

### 测试脚本
- `scripts/mock-test-ratio.js` — 自动化API参数验证

---

## 版本变更记录

| 版本 | 日期 | 变更 |
|------|------|------|
| v4.0 | 2026-05-20 | 角色档案库、5轮E2E测试 |
| v4.0-patch | 2026-05-20 | 分辨率1080p、role分配修复 |
| v4.0-patch2 | 2026-05-20 | 分辨率+role双修复 |
| v4.0-patch3 | 2026-05-21 | 后期管线v4（去字幕烧录） |
| **v4.0-patch4** | **2026-05-21** | **API参数补全（ratio+duration）** |

---

## 待办后续
- [ ] 使用patch4重新渲染横纹肌溶解EP01（横屏16:9）
- [ ] 验证Seedance 2.0 API对`ratio`参数的响应
- [ ] 检查其他调用脚本是否存在相同问题

---

## 经验教训
1. **API参数完整性检查**：调用外部API时，必须对照官方文档检查所有必需参数
2. **输出格式验证**：渲染完成后立即检查分辨率，不要等合并后才发现
3. **Mock测试覆盖**：API参数结构验证应纳入标准Mock测试流程

---

发布人：小G  
发布时间：2026-05-21 12:05 CST
