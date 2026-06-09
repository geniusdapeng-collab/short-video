# Seedance视频生成统一平台 v6.0-patch1

## 修复内容

### 🔴 P0：Prompt长度标准统一（490→980）
1. **systems/universal-style-injector.js**
   - `checkUtilization()`: maxLength 490→980, minLength 450→950
   - `inject()`: 上限检查 490→980
   - 错误信息更新：450-490字→950-980字

2. **systems/character-prompt-builder.js**
   - `maxChineseChars`: 490→980
   - `maxEnglishChars`: 980（保持不变，已统一）
   - 注释更新：490中文字→980英文字符上限

3. **systems/character-manager-v2.js**
   - `maxChineseChars`: 490→980

4. **systems/pre-render-validation.js**
   - `maxChars`: 490→980

5. **systems/storyboard-validator.js**
   - `maxChars`: 490→980

6. **mock测试脚本同步更新**
   - `mock-e2e-v4.js`: maxChars 490→980
   - `mock-test-character-v2.js`: 490→980

### 🟠 P1：Math.random()→确定性选择
1. **systems/camera-movement-system.js**
   - `getPhysicsBinding()`: Math.random()→基于shot ID哈希的确定性选择

2. **systems/worldview-consistency-engine.js**
   - `enhanceProtagonistTone()`: Math.random()→基于narration哈希的确定性选择
   - `_shuffle()`: Fisher-Yates随机→基于字符串哈希的确定性排序

## 测试结果
```
✅ 通过: 12/12 (100%)
❌ 失败: 0
```

## 影响评估
- **Prompt信息利用率**: 从50%→95%+，充分利用API上限
- **生成一致性**: 同一镜头多次生成结果一致，缓存命中率提升
- **无破坏性变更**: 所有现有API保持兼容

## 待确认问题（外部AI报告中的#1/#2/#7）
- #1 PortraitStudio悬空依赖：当前代码库中未找到相关文件，可能已删除/重构
- #2 并发锁死锁：当前代码库中未找到volcengine-api-client.js
- #7 Nirath映射边界：当前代码库中未找到orient-primordial-core-v21.js

**建议**：队长确认上述文件是否存在于特定生产脚本中，如存在请提供路径，我将继续修复。

## 版本号
**v6.0-patch1**

## 发布时间
2026-05-22
