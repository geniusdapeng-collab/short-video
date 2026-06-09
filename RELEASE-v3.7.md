# RELEASE-v3.7 - 运镜控制系统 v1（Seedance 2.0运镜方法论）

**发布时间**: 2026-05-20
**升级性质**: 系统级能力扩展（吸收运镜方法论精华）

## 核心升级

### 1. 运镜控制系统 `camera-movement-system.js`
基于Seedance 2.0运镜方法论，实现**用相机的运动讲故事**：

**六大基础运镜动作库**：
| 动作 | 关键词 | 情绪效果 |
|------|--------|----------|
| 推/拉 | push_in, pull_out | 揭示/远离 |
| 平移 | pan_left, pan_right | 追踪/扫视 |
| 升降 | crane_up, crane_down | 格局展开/俯冲 |
| 环绕 | orbit_cw, swirl_180 | 包围/爆发 |
| 跟拍 | track_back, follow | 追踪/同步 |
| 制动 | brake_hold, whip_pan | 定格/急转 |

**景别层级系统**：
| 景别 | 适用场景 |
|------|----------|
| extreme_wide | 超大环境、史诗感 |
| wide | 场景建立、空间感 |
| full | 全身/动态捕捉 |
| medium | 半身/互动 |
| close_up | 面部/表情 |
| extreme_close | 微距/器物细节 |

**速度修饰词（情绪映射）**：
| 速度 | 词 | 情绪 |
|------|----|------|
| silky | 极其丝滑地 | 优雅、掌控 |
| fast | 极速 | 紧张、危机 |
| sudden | 猛然 | 转折、爆发 |
| smooth | 极其连贯地 | 流畅、沉浸 |
| extreme | 极其/极度 | 极限、超负荷 |

### 2. 情绪峰值运镜模型
自动识别镜头所处阶段，匹配运镜强度：
```
建立(0-15%) → 上升(15-45%) → 蓄力(45-75%) → 爆发(75-90%) → 定格(90-100%)
   强度3        强度6          强度8           强度10         强度4
```

### 3. 角色类型→默认运镜方案映射
| 角色 | 默认景别 | 默认方位 | 默认动作 | 默认速度 |
|------|----------|----------|----------|----------|
| opening | medium | front | push_in | silky |
| explanation | medium | side_front | follow | smooth |
| demonstration | full | back | track_back | fast |
| interaction | medium | side | orbit_cw | silky |
| closing | medium | front | brake_hold | sudden |

### 4. 物理绑定（可选）
镜头运动受物理法则驱动：
- 爆炸冲击波 → 镜头被气浪推动
- 主体动作 → 镜头产生惯性偏移
- 特效爆发 → 镜头后座力震颤

## 技术规范

### 运镜配置字段（storyboard.json）
```json
{
  "cameraMovement": {
    "shotSize": "medium",
    "position": "front",
    "movement": "push_in",
    "speed": "silky",
    "physics": false,
    "timeRange": { "start": 0, "end": 5 }
  }
}
```

### 生成运镜描述格式
```
0秒至5秒，（一镜到底！）半身/互动在正前方，
极其丝滑地推进，同时嘴部微微张开正在说话，
建立阶段，情绪强度3/10。
```

### 配置项
| 配置 | 默认值 | 说明 |
|------|--------|------|
| enablePhysicsBinding | true | 启用物理绑定 |
| enableTimeSegmentation | true | 启用时间轴分段 |
| enableRhythmPhase | true | 启用情绪峰值识别 |

## 验证器集成

### storyboard-validator.js 更新
- 新增 `validateCameraMovement()` 方法
- 检查 `shotSize`/`position`/`movement`/`speed` 字段有效性
- 未配置 `cameraMovement` 时跳过（不强制）
- 无效配置 → error（拦截渲染）

## Mock测试结果（7/7通过）

| # | 测试项 | 结果 | 说明 |
|---|--------|------|------|
| 1 | 单镜头运镜生成 | ✅ | 描述完整，时间区间正确 |
| 2 | 完整故事板处理 | ✅ | 5镜全部生成，阶段分布完整 |
| 3 | 节奏阶段识别 | ✅ | 8镜分布: establish×2→rise×2→build×2→climax→resolve |
| 4 | 时间轴分段连续性 | ✅ | 0-5-10-15秒连续无中断 |
| 5 | 不同角色默认方案 | ✅ | 4种角色4种不同方案 |
| 6 | 运镜描述合规性 | ✅ | 完整配置✅ 缺失配置❌(2错误) |
| 7 | 物理绑定开关 | ✅ | 启用/禁用正常 |
| 8 | 验证器集成 | ✅ | 3/3有效，1/1错误检测 |

## 文件清单

| 文件 | 变更 | 说明 |
|------|------|------|
| `systems/camera-movement-system.js` | 新增 | 核心运镜控制系统 |
| `systems/storyboard-validator.js` | 更新 | 增加运镜验证 |

## 使用方法

### 1. 自动生成（推荐）
```javascript
const system = new CameraMovementSystem();
const result = system.processStoryboard(storyboard);
// result.shots[i].cameraMovement.description 即为运镜描述
```

### 2. 手动配置
在 `storyboard.json` 中为每镜添加 `cameraMovement` 字段：
```json
{
  "cameraMovement": {
    "shotSize": "close_up",
    "position": "side_front",
    "movement": "push_in",
    "speed": "sudden"
  }
}
```

### 3. 合并到Prompt
在 `generate-shot-prompts.js` 中将 `cameraMovement.description` 追加到prompt末尾。

## 后续优化方向

1. **Prompt集成**：将运镜描述自动合并到shot prompt中
2. **动态节奏**：根据内容情感分析自动选择节奏曲线
3. **多镜头连贯**：检测相邻镜头运镜衔接，避免跳跃
4. **物理特效库**：扩展更多物理绑定场景（火焰、水流、风暴等）

## 升级教训

1. **运镜不是机械指令** —— "镜头向左移动" → "镜头被气浪推向左侧"
2. **速度即情绪** —— 同样的动作，不同速度传递不同情绪
3. **时间轴必须连续** —— 区间不重叠、不中断，上一段结束=下一段起始
4. **景别切换有策略** —— 广角→特写通过"推进"，特写→全景通过"拉高"
5. **物理绑定增强真实感** —— 镜头不是漂浮的，而是受物理法则驱动的
