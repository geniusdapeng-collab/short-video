# 15秒超短裙商业化系统 v0.4.0
# 版本: SHORT-VIDEO-0.4.0-commercial

## 核心架构

### 1. 商品档案库 (Product Archive)
```
products/                           # 商品档案库根目录
├── product-registry.json          # 商品注册表（索引）
├── manner-coffee/               # 示例：Manner咖啡
│   ├── product-info.json         # 商品信息档案
│   ├── portraits/                # 定妆照（1-4张）
│   │   ├── closeup.png         # 特写
│   │   ├── front.png           # 正面
│   │   ├── side.png            # 侧面
│   │   └── threeQuarter.png    # 四分之三
│   ├── product-card.md          # 商品描述卡片
│   └── usage-history.json       # 使用历史记录
├── xiaomi-powerbank-20000/      # 示例：小米充电宝
│   ├── product-info.json
│   ├── portraits/
│   │   └── ...
│   ├── product-card.md
│   └── usage-history.json
└── qwen-ai-glasses/              # 示例：千问AI眼镜
    ├── product-info.json
    ├── portraits/
    │   └── ...
    ├── product-card.md
    └── usage-history.json
```

### 2. 商品信息档案 (product-info.json)
```json
{
  "id": "manner-coffee",
  "name": "Manner Coffee",
  "category": "beverage",        // 类别：beverage/tech/wearable/...
  "brand": "Manner",
  "model": "经典拿铁",
  "description": "精品咖啡，手工冲泡",
  "visualFeatures": {           # 视觉特征（用于Prompt生成）
    "color": "暖棕色+奶白色",
    "shape": "圆柱形纸杯",
    "logo": "绿色Manner字样",
    "texture": "纸杯质感+咖啡液面光泽",
    "size": "中杯360ml"
  },
  "usageScenarios": [           # 适用场景
    "桌面摆放",
    "手持饮用",
    "工作场景",
    "户外携带"
  ],
  "implantStrategy": {          # 植入策略
    "hook": "特写拉远 reveal",     # 钩子镜头：从商品特写拉远 reveal 场景
    "climax": "手持特写",          # 高潮镜头：角色手持商品特写
    "resolution": "桌面定格"        # 收束镜头：商品桌面定格
  },
  "portraits": {               # 定妆照路径
    "closeup": "portraits/closeup.png",
    "front": "portraits/front.png",
    "side": "portraits/side.png",
    "threeQuarter": "portraits/threeQuarter.png"
  },
  "createdAt": "2026-06-09",
  "updatedAt": "2026-06-09",
  "usageCount": 0               # 使用次数统计
}
```

### 3. 广告植入引擎 (Commercial Implant Engine)

#### 植入方式矩阵
| 商品类型 | 钩子(3s) | 高潮(7s) | 收束(5s) | 引用方式 |
|---------|---------|---------|---------|---------|
| **咖啡** | 桌面特写→拉远 | 手持饮用 | 蒸汽定格 | 场景道具 |
| **充电宝** | 电量低提示→亮起 | 手持充电 | 指示灯闪烁 | 手持道具 |
| **智能眼镜** | 镜片反光→睁眼 | 佩戴者视角 | 眼镜特写 | 穿戴配件 |
| **饮料** | 开瓶→气泡喷出 | 畅饮特写 | 空瓶定格 | 手持道具 |
| **手机** | 屏幕亮起→画面 | 手持拍摄 | 屏幕定格 | 手持道具 |
| **包包** | 包角特写→拉开 | 取出物品 | 包身定格 | 穿戴/手持 |

#### 植入融合策略
1. **剧情融合**：商品推动剧情发展（电量低→充电宝→继续冒险）
2. **视觉融合**：商品成为视觉焦点（智能眼镜的镜片反光）
3. **情感融合**：商品承载情感（咖啡=温暖/充电=能量）
4. **记忆融合**：商品成为记忆锚点（最后一帧定格商品）

### 4. 预生产流程更新

#### Stage 0.5: 商业化检查（新增）
```
[预生产开始]
  ↓
Stage 0.5: 商业化检查
  ↓
  ├─ 检查项目是否有商业化配置
  │   ├─ 有 → 使用已有商品，继续
  │   └─ 无 → 主动询问队长
  │       ↓
  │       "队长，本次15秒是否植入商业化广告？"
  │       ├─ "否" → 跳过，继续正常流程
  │       └─ "是" → 收集商品信息
  │           ↓
  │           1. 询问商品类型（咖啡/充电宝/眼镜/...）
  │           2. 询问品牌名称
  │           3. 询问商品描述（3-5句话）
  │           4. 请求上传定妆照（1-4张）
  │           5. 保存到商品档案库
  │           ↓
  │           继续预生产流程
```

### 5. Prompt 注入机制

#### 商品视觉描述注入
在 Stage 11（Prompt组装）时，根据植入策略注入商品描述：

```
【商品植入】Manner Coffee
- 位置：桌面中央
- 状态：热气腾腾，纸杯上绿色Logo清晰可见
- 互动：角色手持纸杯，轻抿一口
- 特写：咖啡液面光泽，奶泡纹理
- 约束：必须清晰展示品牌Logo，不能遮挡
```

#### 商品定妆照引用
使用 Seedance referenceImages API：
```json
{
  "referenceImages": [
    {
      "imageUrl": "products/manner-coffee/portraits/front.png",
      "type": "product",
      "weight": 0.8
    }
  ]
}
```

### 6. 商业变现策略

#### 定价模型
| 植入类型 | 价格 | 说明 |
|---------|------|------|
| 场景植入 | ¥500/条 | 商品作为背景道具 |
| 手持植入 | ¥1000/条 | 角色手持商品 |
| 特写植入 | ¥2000/条 | 3秒商品特写 |
| 剧情植入 | ¥3000/条 | 商品推动剧情 |

#### 成本覆盖
- 15秒渲染成本：~¥50/条（Seedance API）
- 单条广告收入：¥500-3000
- 利润率：90%+

### 7. 使用流程

#### 首次使用（新商品）
1. 队长确认植入广告
2. 提供商品信息（名称/品牌/描述）
3. 上传定妆照（1-4张）
4. 系统保存商品档案
5. 生成带广告的视频

#### 复用商品（已有档案）
1. 队长确认植入广告
2. 系统列出已有商品档案
3. 队长选择商品
4. 直接复用，无需重新上传
5. 生成带广告的视频

---
*设计日期: 2026-06-09*
*版本: SHORT-VIDEO-0.4.0-commercial*
