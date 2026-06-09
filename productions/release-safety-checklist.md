# 🛡️ 发布防错机制 v1.0

## 事故复盘：v6.3-patch5 "幽灵修复"

### 事故描述
2026-06-05，v6.3-patch5 的所有修复已写入文件系统，但**未执行 `git commit`**。
- `.current-version` 已改为 `v6.3-patch5`
- git 记录仍为 `v6.3-patch4`
- 运行时读取的是文件系统最新代码（实际生效），但用户查看 git log 看到的是旧版本
- 造成 "修复了但好像没生效" 的混乱，多次运行后才发现真相

### 根因分析（按优先级排序）

1. **流程缺失**：没有发布检查清单（Checklist），修复后凭感觉"应该提交了"
2. **验证盲区**：修改了 `.current-version` 但没验证 `git log` 确认提交成功
3. **注意力分散**：连续修复多个问题（25个Bug），在收尾阶段遗漏了最后一步提交动作
4. **无自动化钩子**：没有 pre-commit 或 CI 检查版本号一致性

### 影响
- 3次饕餮EP01预生产运行失败（用户以为是OOM复发，实际是超时阈值未更新）
- 浪费 3×60 = 180 分钟等待时间
- 用户信任受损（"天呐，我们居然有如此低等的错误"）

---

## 🔒 防错机制（不可跳过）

### 机制1：发布检查清单（Checklist）

每次版本发布前，必须逐项勾选：

```
□ 1. 所有代码修改已保存到文件
□ 2. .current-version 已更新（x.x-patchX）
□ 3. git add -A 已执行
□ 4. git commit 已执行（提交消息包含版本号）
□ 5. git log --oneline -3 确认最新提交是目标版本
□ 6. .current-version 和 git HEAD 一致（cat + git log 交叉验证）
□ 7. 生产环境已验证（跑一次完整链路）
```

**强制规则**：未勾选全部7项，不得向用户报告"发布完成"。

### 机制2：双重验证脚本

在 `scripts/` 目录添加 `verify-release.js`：

```javascript
#!/usr/bin/env node
const fs = require('fs');
const { execSync } = require('child_process');

const versionFile = fs.readFileSync('.current-version', 'utf8').trim();
const gitLog = execSync('git log --oneline -1').toString().trim();

if (!gitLog.includes(versionFile)) {
  console.error(`❌ 版本不一致! .current-version=${versionFile}, git=${gitLog}`);
  process.exit(1);
}
console.log(`✅ 版本一致: ${versionFile}`);
```

**强制规则**：每次修改 `.current-version` 后，必须运行 `node scripts/verify-release.js` 验证。

### 机制3：提交消息模板

强制使用包含版本号的提交消息：

```
v6.3-patchX: [简短描述]

[详细描述...]

发布检查清单:
□ .current-version 已更新
□ git commit 已执行
□ 版本一致已验证
```

### 机制4：发布记录强制归档

每次发布必须创建 `productions/v6.3-patchX-release-notes.md`：

```markdown
# v6.3-patchX 发布记录

## 核心修复
- [ ] 修复1
- [ ] 修复2

## 发布检查
- [x] .current-version = v6.3-patchX
- [x] git commit 成功 (SHA: xxx)
- [x] 版本一致验证通过
- [x] 生产环境验证通过
```

**强制规则**：没有发布记录文件，视为发布未完成。

### 机制5：紧急回滚预案

如果发现提交失败/版本不一致：

1. **立即停止**：不向用户报告"发布完成"
2. **诊断**：运行 `git status` 和 `git log --oneline -3`
3. **修复**：执行 `git add -A && git commit -m "v6.3-patchX: ..."`
4. **验证**：运行 `verify-release.js`
5. **重新报告**：确认无误后再通知用户

---

## 📋 本次事故修复验证

- [x] v6.3-patch6 超时修复已提交（60min→90min）
- [x] v6.3-patch5 未提交修复已补齐（内存释放/LLM参数/1000合规）
- [x] .current-version = v6.3-patch6 ✅
- [x] git HEAD = 2d5be9e v6.3-patch6 ✅
- [x] 版本一致 ✅
- [x] 发布记录已创建：`productions/v6.3-patch6-release-notes.md`
- [x] 防错机制已写入：`productions/release-safety-checklist.md`

---

## 教训总结

1. **提交 ≠ 保存**：修改文件后必须 `git commit`，否则 git 不知道
2. **版本号是信号**：`.current-version` 和 `git log` 必须一致，不一致=发布失败
3. **检查清单是底线**：再简单的发布也要逐项勾选，防"想当然"
4. **验证自动化**：关键验证脚本化，减少人为遗漏

**Stay Hungry, Stay Foolish, Stay Brutally Honest.**
Never assume. Always verify.
