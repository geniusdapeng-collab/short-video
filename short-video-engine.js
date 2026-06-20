/**
 * 超短裙系统主链路引擎 (Short Video Engine)
 * 版本: SHORT-VIDEO-0.7.2-product-hero
 * 
 * 核心能力：
 * 1. 极限运动镜头库 (Xtreme Shot Library) - 肾上腺素飙升镜头
 * 2. 商品主角引擎 (Product Hero Engine) - 产品占据视觉焦点30-50%
 * 3. Prompt 扩充引擎 - 85字符→1500字符，16倍信息密度提升
 * 4. 社媒营销短片生成 (Social Media Short Video)
 * 5. 角色一致性管理 (Character Consistency)
 * 
 * 使用方式：
 * const engine = require('./short-video-engine');
 * engine.generateSocialMediaShort({ product: 'Red Bull', scene: 'xtreme', heroMode: true });
 */

'use strict';

const { XtremeShotLibrary, XTREME_SHOTS, ANGLE_TYPES, COMBO_SEQUENCES } = require('./systems/xtreme-shot-library');

// ==================== 版本信息 ====================

const VERSION = {
  major: 0,
  minor: 7,
  patch: 2,  // 升级patch：商品主角引擎上线
  codename: 'product-hero',
  full: 'SHORT-VIDEO-0.7.2-product-hero',
  releaseDate: '2026-06-10',
  features: [
    '极限运动镜头库 (Xtreme Shot Library v1.0.0)',
    '8种极限运动 × 5种视角 = 40+ 镜头',
    '5种组合序列：经典三段式 / 肾上腺素爆发 / 慢动作 / 沉浸式 / 电影感',
    'Prompt 扩充引擎：85字符 → 1500字符（16倍信息密度提升）',
    '7维扩充：视觉场景 / 运镜指令 / 技术参数 / 质感风格 / 环境音效 / 时间感知 / 氛围情绪',
    '商品主角引擎 (Product Hero Engine) - 产品占据视觉焦点30-50%',
    '商品卖点自动分析：预设10+品牌 + 自动关键词提取 + 别名映射',
    '商品→极限运动智能映射：防水→冲浪/跳伞/高山，抓地→跑酷/攀岩/滑板',
    '商品主角镜头类型：特写/运动中消费/冲击测试/POV拍摄/环绕等13种',
    '社媒营销短片：强制产品参数 + 商品主角模式开关',
    '质量门：字符数检查 + 自动截断 + 自动补全',
    '角色一致性管理'
  ]
};

// ==================== Prompt 扩充引擎 (Prompt Expansion Engine) ====================
// 目标: 将基础 prompt 自动扩充到 1200-1500 字符
// 策略: 按维度动态拼接，基础 prompt + 场景描述 + 技术参数 + 质感风格

const PROMPT_MAX_CHARS = 1500;   // 上限
const PROMPT_MIN_CHARS = 1200;   // 最低要求
const PROMPT_TARGET_CHARS = 1450; // 目标

// 视觉场景维度 (按运动类型)
const VISUAL_SCENES = {
  alpine: '巍峨雪山连绵起伏，海拔3000米高海拔雪域，空气稀薄能见度极高，远处山峰被朝阳染成金红色，近处雪道洁白如丝绸，粉雪深度超30厘米，雪晶在阳光下闪烁如钻石粉末，雪松屹立在雪道两侧形成天然屏障，树枝挂满雾凇如水晶雕塑，天空从深邃蔚蓝渐变暖橙色，阳光穿透大气层形成丁达尔光柱，雪面反射率90%形成强烈明暗对比，远处滑雪度假村隐约可见，缆车索道在空中划出弧线，雪道标志杆红蓝相间醒目，雪墙高度超2米形成天然半管，U型池内壁光滑如镜，跳台起坡角度35度，着陆坡坡度25度符合国际雪联标准，安全网在背景中隐约可见，急救站标志在远处闪烁，赛事横幅迎风飘扬，人工造雪机喷射水雾在低温中凝结成雪，压雪车履带痕迹整齐如农田，雪道边缘防护垫厚实可靠，起点门电子计时器数字跳动，终点线彩带在风中翻飞，云海在山谷中翻涌如沸腾牛奶，日照金山时刻山峰从暗蓝瞬间变为金黄如火焰燃烧，日落时分雪山从金红渐变为深紫融入墨蓝夜色，星光在稀薄大气中格外明亮银河横贯天际',
  
  skydiving: '万米高空视野极度开阔，地平线呈现明显弧形显示地球曲率，天空从脚下深邃蔚蓝渐变为头顶近乎黑色的深空，平流层气流稳定几乎无颠簸，阳光在无云环境中格外刺眼需要护目镜保护，紫外线强度极高皮肤有灼热感，下方云层如棉花糖般蓬松堆积，积云高度约3000米如白色岛屿漂浮在蓝天海洋，云海如南极冰盖般连绵不绝，云层间隙露出大地如绿色棕色拼布，河流如银色丝带蜿蜒，湖泊如蓝色宝石镶嵌，城市如沙盘模型精致有序，道路网络如神经系统遍布大地，山脉如皮肤褶皱起伏，海岸线如不规则锯齿切割陆地，太阳将云层边缘染成金红如熔岩流动，影子在云层上被拉长成巨大黑色剪影，光环现象在云海之上形成明亮光晕如天使光环，开伞后下降速度骤减世界从模糊变为清晰，伞绳在头顶如放射状线条向中心汇聚，伞衣色彩鲜艳在蓝天中格外醒目如盛开花朵，备份伞在头顶上方静静待命如沉默守护者，高度计数字快速跳动，GPS定位在手腕上显示精确坐标，着陆场从指甲大小逐渐变为清晰可辨，草地颜色从深绿到浅绿显示湿度差异，风向袋在地面指示风向，着陆区标志呈T字形白色标记在绿色草坪上，降落过程中可以看到地面细节越来越清晰',
  
  surfing: '热带海洋环境水温26-28度舒适宜人，海水从近岸浅绿渐变为远处深蓝如宝石色彩渐变，海浪从外海涌来波长数十米如移动的水墙，浪高约2-3米适合进阶冲浪者挑战，浪壁角度约30度形成完美管状空间，浪头卷曲处形成半透明绿色水幕如水晶洞穴，阳光穿透浪壁形成光斑在内部游动如置身水族馆，浪顶白色泡沫如啤酒泡沫丰富细腻，浪花飞溅形成细小水珠在空中悬浮如钻石粉尘，海水盐度使漂浮感增强，海底白沙在阳光下闪烁，珊瑚礁在浅水区隐约可见色彩斑斓，热带鱼群在浪底穿梭如流动的彩虹，海龟在远处浮出水面换气，海豚偶尔在浪外跃起划出优美弧线，海岸线椰林摇曳如绿色羽毛，沙滩洁白细腻如面粉，远处火山岛屿轮廓在薄雾中若隐若现，火山灰土壤使植被格外翠绿，季风气候带来稳定涌浪，信风吹拂头发形成自然造型，冲浪板在浪壁上划出白色痕迹如画家笔触，板尾水花形成扇形扩散，起乘瞬间重心从俯卧到站立的力学转换，膝盖弯曲吸收浪面震动，双臂展开如翅膀保持平衡，视线穿过浪管看向出口的光明，被浪管包围的瞬间世界只剩水声和光线，出水瞬间阳光普照如重生',
  
  skateboarding: '城市极限运动环境，混凝土滑板公园设施几何线条分明，碗池深度约2-3米内壁光滑如打磨大理石，U型池垂直墙面约90度挑战重力极限，碗池边缘 coping 钢管铮亮，坡道角度从15度到45度不等，跳台高度从30厘米到2米分级设置，栏杆、台阶、长凳、路缘石都被改造成可滑行的障碍物，地面涂鸦色彩鲜艳风格从抽象到写实各异，墙面涂鸦艺术反映街头文化，滑板公园围网铁丝网格在阳光下闪烁，城市背景高楼林立玻璃幕墙反射天空，远处交通噪音形成环境音景，街头篮球架在角落见证运动文化交融，自行车特技者在旁边区域练习，BMX骑手在坡道上腾空，轮滑者穿梭在碗池边缘，音乐从便携式音箱播放hip-hop或朋克摇滚，观众坐在台阶或围栏上观看，手机镜头对准精彩瞬间，滑板轮子在地面滚动发出独特嗡嗡声，轴承转速决定音调高低，滑板板面在脚下微微弯曲显示弹性，砂纸表面摩擦鞋底提供抓力，板头板尾翘起角度精确设计，轮子硬度101A在光滑地面滑行如冰，轴承ABEC-7转速流畅，桥架铝合金轻量化',
  
  bmx: '专业BMX赛道环境， dirt 赛道起伏如小型山地，土坡高度约1-2米呈完美抛物线，起跳坡角度约30度，着陆坡更缓约20度确保安全，赛道表面压实泥土颜色从浅棕到深褐，雨后赛道表面湿润反光如巧克力酱，晴天赛道表面干燥粉末飞扬，赛道两侧安全护栏高约1米，裁判塔高踞角落俯瞰全场，计时系统在起点和终点精确到千分之一秒，观众席沿赛道排列如古罗马竞技场，旗帜和横幅在赛道周围迎风招展，维修区帐篷如彩色蘑菇排列，专业车手在热身区练习基础动作，教练在赛道旁拿着秒表记录，机械师在维修帐篷调整齿轮比，车队经理在指挥区分析数据，起跳瞬间车手与自行车成为一体，在空中做出各种 body varial 动作，车身旋转如陀螺，车手在最高点伸展身体如体操运动员，落地瞬间冲击通过避震前叉吸收，轮胎在泥土上留下短暂痕迹随即被后续车轮覆盖，链条在齿轮间切换发出金属撞击声，刹车线在手指下紧绷如琴弦，变速器在换挡杆操作下精确跳动',
  
  climbing: '天然岩壁环境，花岗岩表面粗糙颗粒如磨砂纸，石灰岩壁呈现独特喀斯特地貌，砂岩表面层理分明如千层蛋糕，冰壁晶莹剔透如蓝色水晶柱，岩壁高度从20米到1000米不等，裂缝系统如大地皱纹，岩点从微小边缘到巨大jug不一，sloper 岩点圆润光滑考验摩擦力，pinch 岩点需要手指捏合力，crimp 岩点边缘锋利如刀片，pocket 岩点需要单指或双指插入如钥匙开锁，slab 岩壁角度小于90度摩擦为主，vertical 垂直岩壁技术均衡，overhang 仰角超过90度需要强大核心力量，roof 水平岩壁完全倒挂，dyno 动作需要爆发力腾跃，deadpoint 动作在最高点精确抓住目标，heel hook 脚后跟勾住岩点，toe hook 脚尖勾住岩点，knee bar 膝盖卡住裂缝休息，stem 动作双腿分开撑住两侧岩壁，mantle 动作从pull变为push如从游泳池边爬出，layback 动作身体后仰利用反作用力，drop knee 动作膝盖下沉增加reach，flag 动作腿向侧方伸展保持平衡，exposure 暴露感高度带来的心理压力，runout 保护点间距过大心理恐惧，free solo 无保护攀登最纯粹也最危险，boulder 矮岩壁无绳索靠垫子保护，chalk bag 镁粉袋在腰间摇晃，chalk 镁粉在岩点上留下白色痕迹，pump 前臂肌肉因乳酸堆积而膨胀僵硬',
  
  motocross: '越野摩托赛道环境，泥土赛道宽约5-8米，起伏路面如海浪般连绵，跳跃台高度从1米到3米不等，起跳坡角度约25度，着陆坡角度约15度，tabletop 跳台平顶设计安全，double jump 两个跳台需要精确控制，triple jump 三个跳台展示最高水平，whoops 连续小坡考验节奏感，berm 弯道倾斜路面如赛道，rut 车辙深度可达30厘米，kicker 跳台边缘凸起提供额外弹起，face 跳台正面，lip 跳台顶部边缘，landing 着陆区域，run-up 起跳前加速区域，take-off 起跳瞬间，airtime 空中停留时间，hang time 悬浮感，seat bounce 利用座椅弹力，scrub 压低车身减少空中时间，whip 空中倾斜车身，nac-nac 空中踢腿动作，superman 空中伸展如超人，cliffhanger 脚尖钩住车把，no-hander 双手放开，no-footer 双脚离开脚踏，tailwhip 车尾旋转，backflip 后空翻，frontflip 前空翻，double backflip 双后空翻，freestyle 自由式，racing 竞速，enduro 耐力赛，supercross 超级越野，stadium 体育场环境，nights 夜场灯光，mud 泥浆环境，rain 雨战环境，sand 沙地环境，starting gate 起跑门，finish line 终点线，checkered flag 方格旗结束，green flag 绿旗开始，yellow flag 黄旗警告，red flag 红旗终止',
  
  parkour: '城市跑酷环境，混凝土建筑立面如几何雕塑，墙面材质从光滑瓷砖到粗糙砖面各异，窗户排列如抽象画框，阳台栏杆如水平梯子，空调外机平台如跳跃垫，雨水管垂直如攀援杆，屋顶女儿墙高度约1.2米，屋顶表面平坦如广场，屋顶设备如通风管、水塔、天线成为障碍物，两楼之间间隙约2-3米需要跳跃跨越，楼梯扶手如滑梯，楼梯台阶如节奏练习，地下通道入口如黑暗隧道，地下停车场柱子如障碍绕杆，城市广场地砖图案如棋盘，喷泉边缘如平衡木，长椅如跳跃平台，花坛边缘如精准着陆点，路灯杆如垂直攀爬，树木如自然障碍，围栏如翻越练习，铁丝网如危险边界，玻璃幕墙如镜面反射，建筑工地脚手架如立体迷宫，拆迁建筑废墟如末日场景，隧道墙壁如回声空间，桥梁结构如钢铁森林，高架桥墩如巨型石柱，火车轨道如线性空间，地铁轨道如黑暗深渊，城市天际线如背景画布，黄昏时分光线斜射形成长影，夜晚城市灯光如星空倒置，霓虹灯招牌如彩色光幕，车流灯光轨迹如流动光河，人群如模糊背景，个体在都市环境中快速移动如穿越游戏的玩家角色'
};

// 运镜指令维度 (按视角)
const CAMERA_INSTRUCTIONS = {
  pov: '第一人称主观视角（POV）进行拍摄，GoPro极限视角身临其境，镜头轻微震动模拟真实运动，鱼眼镜头夸张变形增强沉浸感，画面边缘轻微畸变如真实运动相机，主角双手/装备在画面边缘可见增强代入感，呼吸节奏造成的轻微晃动，高速运动中的动态模糊，雪花/水花/泥土飞溅到镜头上形成真实物理遮挡，镜头上的水珠/尘埃颗粒清晰可见，VR沉浸感360度环绕，主观视角体验极限运动的肾上腺素飙升',
  
  follow: '专业跟拍摄影（Follow/Tracking），斯坦尼康平滑如幽灵漂浮，长镜头（Long Take）一镜到底无剪辑，镜头紧贴主体运动轨迹，保持主体在画面中央三分之一处，背景动态模糊显示速度感，专业体育赛事拍摄水准，电影级稳定器效果，跟焦精准主体始终清晰，背景虚化分离主体，运动摄影车轨道追踪，直升机航拍跟拍，无人机穿越机高速跟随，FPV Drone 灵活机动跟拍，车身/身体遮挡转场自然流畅，速度线从主体向后放射',
  
  side: '侧面高速拍摄（Side/Profile），移镜头（Truck）横向移动保持主体在画面内，标准镜头（Standard）50mm接近人眼视角，长焦镜头（Telephoto）200mm压缩空间，主体在画面正中侧面轮廓清晰，速度感通过背景横向 streak 效果表现，慢动作镜头（Slow Motion）时间凝固至1/8速度，定格镜头（Freeze Frame）瞬间静止，侧面展现动作幅度和身体姿态，肌肉线条在紧张状态下清晰可见，运动服装材质褶皱和质感，装备细节特写，阳光从侧面勾勒身体轮廓形成 rim light',
  
  top: '航拍俯拍（Top/Aerial），上帝视角俯瞰，无人机航拍（Aerial）垂直俯视，螺旋镜头（Spiral）同时上升和旋转，720度全景展示环境全貌，微缩景观效果如玩具世界，高度感让主体显得渺小但环境壮观，地形地貌全貌尽收眼底，运动轨迹在画面中形成优美线条，对比度强烈主体与环境分离，彩色装备在白色雪地/绿色草地/蓝色海洋中格外醒目，运动轨迹如画家笔触在画布上延伸，卫星视角宏观壮观，世界地图般的俯瞰感',
  
  low: '仰角拍摄（Low Angle），升镜头（Crane Up）垂直上升营造渺小感，仰拍角度使主体显得高大威猛，天空作为背景纯净简洁，仰拍展现跳跃高度和腾空姿态，建筑/山峰在背景中形成压迫感，广角镜头（Wide Angle）16mm焦段容纳更多环境，变形宽银幕镜头（anamorphic）独特光晕，仰拍角度强调动作难度和勇气，从地面向上拍摄尘土/雪花/水花飞溅，主体剪影在天空背景下，逆光拍摄形成轮廓光，英雄视角仰视极限运动者，史诗感宏大叙事'
};

// 技术参数维度
const TECHNICAL_SPECS = '技术参数：8K超高清画质，120fps高帧率拍摄，HDR高动态范围，色彩空间Rec.2020，宽色域P3，Log模式保留最大后期空间，ProRes 422 HQ编码，ISO 800-3200根据光线自动调整，快门角度180度保持自然运动模糊，光圈f/2.8-f/5.6平衡进光与景深，对焦模式连续自动追踪（AF-C），防抖系统机身五轴+镜头光学双重防抖，色彩分级电影感青橙色调，对比度适中保留暗部细节，高光压制防止过曝，阴影提升保持细节，锐化适度避免过度数码感，降噪处理保留颗粒质感，胶片模拟Kodak Vision3 500T 5219，颗粒感35mm胶片质感，暗角轻微晕影引导视觉中心';

// 质感风格维度
const STYLE_MOOD = '质感风格：电影级叙事（Cinematic），极限运动纪录片（Extreme Sports Documentary），红牛风格高肾上腺素（Red Bull Style），GoPro 运动美学（Action Aesthetic），国家地理级画面质感（Nat Geo Quality），IMAX 巨幕沉浸感，运动品牌广告级制作（Nike/Adidas Commercial），电影感胶片颗粒（Film Grain），运动模糊动态感（Motion Blur），慢动作时间凝固（Slow Motion Poetry），时间流逝压缩感（Time Lapse），长镜头真实感（Long Take Realism），斯坦尼康梦幻漂浮感（Steadicam Dream），FPV穿越机速度感（FPV Speed），水下摄影梦幻感（Underwater Dream），航拍上帝视角（Aerial Majesty），夜拍霓虹赛博朋克（Neon Cyberpunk），夕阳金色时刻（Golden Hour Magic），蓝色时刻冷色调（Blue Hour Cool），极端天气史诗感（Epic Weather）';

// 环境音效暗示维度
const AUDIO_CUES = '环境音效：风声呼啸从耳边掠过，引擎轰鸣震耳欲聋，水花飞溅形成立体声场，雪粉爆裂细微沙沙声，心跳声砰砰作响，呼吸声急促沉重，轮胎摩擦地面尖啸，金属撞击清脆回响，链条传动咔嗒节奏，滑板轮子嗡嗡低频，冲浪板切水嗖嗖声，降落伞开伞砰的一声，岩点摩擦细微碎屑声，肌肉发力低沉 grunt，观众欢呼由远及近，计时器滴答倒数紧张感，快门声连拍如机关枪，对讲机电流杂音，环境氛围音层次丰富，低频震动体感冲击，高频细节清晰分离，混响空间感宏大开阔';

// 时间感知维度
const TIME_PERCEPTION = '时间感知：慢动作1/8速度时间凝固，水滴空中悬浮如水晶，雪花飘落每一片清晰可见，尘土颗粒在阳光中缓慢飞舞，发丝飘动逐帧可见，肌肉颤动逐帧分解，表情变化微妙捕捉，关键帧强调动作顶点，加速镜头压缩时间，延时摄影日出到日落，实时与慢动作混合剪辑，时间扭曲Time Warp，子弹时间环绕冻结主体，瞬间定格与动态对比，过去与现在闪回交织，时间流逝感通过光影变化，秒表数字跳动时间压力，倒计时紧迫感，动作完成后的时间释放感，喘息瞬间时间恢复常态';

// 氛围情绪维度
const EMOTION_VIBE = '氛围情绪：肾上腺素飙升的紧张刺激，突破极限的成就感，自由飞翔的解放感，孤独面对自然的敬畏，征服恐惧的勇气，心流状态的专注，速度带来的狂喜，腾空瞬间的失重感，着陆成功的踏实，观众欢呼的成就感，竞技比赛的紧张，训练多年的积淀，意外失误的惊险，绝处逢生的庆幸，队友默契的信任，挑战自我的决心，极限边缘的快感，速度与激情的碰撞，危险与美丽的共存，生命力量的绽放，超越自我的升华，极限运动精神传承，青春热血的燃烧，梦想实现的感动';

// 辅助函数：获取字符数
function getCharCount(str) {
  return str.length;
}

// 辅助函数：截断到指定长度，优先保留完整句子
function truncateToLength(str, maxLength) {
  if (str.length <= maxLength) return str;
  // 在 maxLength 内找最后一个句号、逗号或空格
  let cutAt = maxLength;
  for (let i = maxLength - 1; i > maxLength - 50 && i > 0; i--) {
    if (['。', '，', '、', ' ', '|', '】'].includes(str[i])) {
      cutAt = i + 1;
      break;
    }
  }
  // 确保严格不超过 maxLength
  return str.substring(0, Math.min(cutAt, maxLength));
}

// ==================== Prompt 扩充核心函数 ====================

/**
 * 扩充基础 prompt 到目标字符数
 * @param {string} basePrompt - 基础 prompt（来自镜头库）
 * @param {string} sport - 运动类型
 * @param {string} angle - 视角类型
 * @param {number} intensity - 强度 1-10
 * @returns {string} 扩充后的 prompt
 */
function expandPrompt(basePrompt, sport, angle, intensity) {
  // 1. 基础 prompt（已包含【镜头】和核心描述）
  let expanded = basePrompt.trim();
  
  // 2. 添加视觉场景（按运动类型）
  if (VISUAL_SCENES[sport]) {
    expanded += ' | ' + VISUAL_SCENES[sport];
  }
  
  // 3. 添加运镜指令（按视角）
  if (CAMERA_INSTRUCTIONS[angle]) {
    expanded += ' | ' + CAMERA_INSTRUCTIONS[angle];
  }
  
  // 4. 添加技术参数
  expanded += ' | ' + TECHNICAL_SPECS;
  
  // 5. 添加质感风格
  expanded += ' | ' + STYLE_MOOD;
  
  // 6. 添加环境音效暗示
  expanded += ' | ' + AUDIO_CUES;
  
  // 7. 添加时间感知
  expanded += ' | ' + TIME_PERCEPTION;
  
  // 8. 添加氛围情绪
  expanded += ' | ' + EMOTION_VIBE;
  
  // 9. 强度调整（如果强度>=9，添加额外肾上腺素描述）
  if (intensity >= 9) {
    expanded += ' | 超极限强度：危险边缘的肾上腺素爆发，生死一线的紧张感，突破人类极限的壮举，极限运动史上留名的瞬间，职业运动员的巅峰状态，千钧一发的关键帧，高难度动作的极致展现，极限环境的双重挑战，身体与意志的极限对抗，观众屏息凝视的瞬间，裁判紧张关注的关键动作，电视转播的慢动作回放，运动品牌的经典广告镜头，极限运动纪录片的高潮段落，载入史册的传奇时刻';
  }
  
  // 10. 截断到上限
  expanded = truncateToLength(expanded, PROMPT_MAX_CHARS);
  
  // 🛡️ 【v0.7.3-fix】PromptGuardian 自动修复（来自超现实系统 v2.1.2）
  try {
    const { PromptGuardian } = require('./scripts/prompt-guardian');
    const guardian = new PromptGuardian();
    const fixResult = guardian.autoFix(expanded, []);
    if (fixResult.changed) {
      console.log(`  🛡️ PromptGuardian[超短裙]: 自动修复 ${fixResult.fixes.length} 处`);
      for (const fix of fixResult.fixes) {
        console.log(`     ${fix.type}: ${fix.action}`);
      }
    }
    expanded = fixResult.prompt;
  } catch (e) {
    // 如果PromptGuardian加载失败，不影响主流程
    console.warn(`  ⚠️ PromptGuardian加载失败: ${e.message}`);
  }
  
  return expanded;
}

/**
 * 检查 prompt 字符数并报告
 * @param {string} prompt - 要检查的 prompt
 * @returns {Object} 检查结果
 */
function checkPromptLength(prompt) {
  const len = getCharCount(prompt);
  return {
    length: len,
    max: PROMPT_MAX_CHARS,
    min: PROMPT_MIN_CHARS,
    target: PROMPT_TARGET_CHARS,
    status: len >= PROMPT_MIN_CHARS ? (len > PROMPT_MAX_CHARS ? 'overflow' : 'ok') : 'under',
    ratio: (len / PROMPT_MAX_CHARS * 100).toFixed(1) + '%'
  };
}

// 导出扩充功能
module.exports.expandPrompt = expandPrompt;
module.exports.checkPromptLength = checkPromptLength;
module.exports.PROMPT_MAX_CHARS = PROMPT_MAX_CHARS;
module.exports.PROMPT_MIN_CHARS = PROMPT_MIN_CHARS;

// ==================== 商品主角引擎 (Product Hero Engine) ====================
// 核心理念：产品才是主角，极限运动是展示产品的舞台

/**
 * 商品卖点分析库 - 从商品名称/描述提取卖点并映射到极限运动场景
 */
const PRODUCT_SELLING_POINTS = {
  // 运动饮料
  'redbull': { category: '运动饮料', features: ['能量爆发', '极限挑战', '专注提升', '耐力持久'], sports: ['alpine', 'skydiving', 'motocross', 'parkour'], heroShots: ['product_closeup', 'consume_mid_action', 'post_action_refresh'] },
  'monster': { category: '运动饮料', features: ['极限能量', '野性释放', '突破边界'], sports: ['motocross', 'skateboarding', 'bmx'], heroShots: ['product_closeup', 'consume_mid_action', 'slowmo_splash'] },
  'gopro': { category: '运动相机', features: ['第一视角', '防水耐用', '极限拍摄', '身临其境'], sports: ['surfing', 'skydiving', 'alpine', 'bmx'], heroShots: ['product_closeup', 'pov_capture', 'impact_test'] },
  'dji': { category: '无人机', features: ['航拍视角', '稳定跟拍', '智能追踪', '极限探索'], sports: ['alpine', 'skydiving', 'surfing', 'parkour'], heroShots: ['aerial_orbit', 'follow_drone', 'dive_with_subject'] },
  
  // 运动鞋
  'nike': { category: '运动鞋', features: ['轻便回弹', '抓地稳定', '空气动力学', '突破极限'], sports: ['parkour', 'skateboarding', 'bmx', 'alpine'], heroShots: ['foot_closeup', 'landing_impact', 'mid_air_detail'] },
  'adidas': { category: '运动鞋', features: ['boost回弹', '精准控制', '专业竞技', '轻盈舒适'], sports: ['parkour', 'skateboarding', 'climbing', 'alpine'], heroShots: ['foot_closeup', 'edge_grip', 'flex_detail'] },
  
  // 户外装备
  'thenorthface': { category: '户外服装', features: ['防风防水', '保暖透气', '极限环境', '专业防护'], sports: ['alpine', 'skydiving', 'climbing', 'surfing'], heroShots: ['product_detail', 'environment_test', 'closeup_texture'] },
  'patagonia': { category: '户外服装', features: ['环保耐用', '极限环境', '可持续发展', '专业性能'], sports: ['climbing', 'surfing', 'alpine', 'skydiving'], heroShots: ['product_detail', 'nature_fusion', 'texture_macro'] },
  
  // 能量食品
  'powerbar': { category: '能量食品', features: ['快速能量', '便携补给', '极限续航', '营养科学'], sports: ['climbing', 'alpine', 'motocross', 'bmx'], heroShots: ['consume_mid_action', 'energy_glow', 'pre_action_prep'] },
  
  // 防晒霜/护肤
  'loreal': { category: '防晒护肤', features: ['防水持久', '极限防晒', '清爽不黏', '专业防护'], sports: ['surfing', 'skydiving', 'alpine', 'motocross'], heroShots: ['face_closeup', 'water_resist', 'sweat_proof'] },
  
  // 智能穿戴
  'applewatch': { category: '智能手表', features: ['极限耐用', '数据追踪', '心率监测', '防水性能'], sports: ['alpine', 'surfing', 'climbing', 'parkour'], heroShots: ['wrist_closeup', 'data_display', 'impact_resist'] },
  'garmin': { category: '专业运动表', features: ['GPS精准', '极限耐用', '专业数据', '超长续航'], sports: ['alpine', 'skydiving', 'climbing', 'motocross'], heroShots: ['wrist_closeup', 'gps_map', 'altitude_display'] },
  
  // 汽车/摩托车
  'bmw': { category: '汽车', features: ['操控精准', '速度激情', '极限驾驶', '豪华性能'], sports: ['motocross', 'alpine'], heroShots: ['product_hero', 'speed_line', 'drift_smoke'] },
  'redbull': { category: '品牌赞助', features: ['极限运动', '能量文化', '挑战不可能', '专业赛事'], sports: ['all'], heroShots: ['logo_hero', 'event_sponsor', 'athlete_endorse'] }
};

/**
 * 商品特征映射到极限运动场景
 * 每个特征 → 最适合展示的极限运动 + 镜头类型
 */
const FEATURE_TO_SPORT_MAP = {
  '能量爆发': { sports: ['alpine', 'motocross', 'parkour'], reason: '高速运动中补充能量，体现即时效果' },
  '防水耐用': { sports: ['surfing', 'skydiving', 'alpine'], reason: '水花、风雪、高空中产品依然完好' },
  '第一视角': { sports: ['skydiving', 'alpine', 'surfing'], reason: 'POV镜头本身就是产品特性展示' },
  '抓地稳定': { sports: ['parkour', 'climbing', 'skateboarding'], reason: '在极限地形中展现抓地力' },
  '轻便回弹': { sports: ['parkour', 'bmx', 'skateboarding'], reason: '腾空动作中展现轻盈' },
  '极限防晒': { sports: ['surfing', 'skydiving', 'alpine'], reason: '强光、高海拔、水面反射的极端环境' },
  'GPS精准': { sports: ['alpine', 'skydiving', 'climbing'], reason: '无信号环境下依然精准定位' },
  '能量续航': { sports: ['climbing', 'alpine', 'motocross'], reason: '长时间极限运动需要持续供能' }
};

/**
 * 商品主角镜头类型定义
 * 每个镜头以产品为视觉焦点，极限运动为背景舞台
 */
const PRODUCT_HERO_SHOTS = {
  'product_closeup': { name: '商品特写英雄镜头', duration: 2, focus: 'product', description: '产品在画面中心，占据30-50%画面，背景虚化展现极限运动环境' },
  'consume_mid_action': { name: '运动中消费镜头', duration: 2, focus: 'action+product', description: '运动员在极限动作中自然使用产品，产品清晰可见' },
  'post_action_refresh': { name: '动作后恢复镜头', duration: 2, focus: 'emotion+product', description: '极限动作完成后，产品带来的恢复/满足感' },
  'pov_capture': { name: 'POV产品拍摄镜头', duration: 3, focus: 'product+experience', description: '通过产品（运动相机）拍摄POV画面，产品是拍摄主体也是画面主体' },
  'impact_test': { name: '冲击测试镜头', duration: 2, focus: 'product+durability', description: '极限冲击中产品完好无损，展现耐用性' },
  'aerial_orbit': { name: '环绕产品镜头', duration: 3, focus: 'product+epic', description: '无人机环绕产品+运动员，产品始终清晰可见' },
  'foot_closeup': { name: '足部装备特写', duration: 2, focus: 'product+detail', description: '运动鞋在极限地形中的特写，抓地/减震/材料细节' },
  'landing_impact': { name: '着陆冲击镜头', duration: 2, focus: 'product+function', description: '运动鞋/BMX着陆瞬间，缓冲系统工作特写' },
  'mid_air_detail': { name: '空中细节镜头', duration: 2, focus: 'product+aesthetic', description: '腾空时产品细节（鞋面/鞋底/logo）在慢动作中清晰展现' },
  'face_closeup': { name: '面部防护特写', duration: 2, focus: 'product+protection', description: '极限环境中面部/皮肤依然完好，产品防护效果' },
  'wrist_closeup': { name: '腕部装备特写', duration: 2, focus: 'product+data', description: '手表在手腕上，数据清晰显示，极限环境正常工作' },
  'speed_line': { name: '速度线产品镜头', duration: 2, focus: 'product+speed', description: '产品伴随速度线/光轨，体现速度感' },
  'logo_hero': { name: 'logo英雄镜头', duration: 2, focus: 'brand', description: '品牌logo在极限场景中的史诗级展示' }
};

/**
 * 商品主角模式 Prompt 生成器
 * 将产品信息融入极限运动镜头，产品始终是视觉焦点
 */
function generateProductHeroPrompt(basePrompt, productInfo, shotType, sport) {
  const { name, features, brand, slogan } = productInfo;
  
  // 1. 产品英雄开场（产品作为主角登场）
  const heroOpening = `【商品主角】${name}作为视觉焦点占据画面30-50%，${features.join('、')}等核心卖点在极限运动场景中被放大展示。`;
  
  // 2. 产品特性与极限运动的融合
  const featureFusion = features.map(f => {
    const mapping = FEATURE_TO_SPORT_MAP[f];
    if (mapping && (mapping.sports.includes(sport) || mapping.sports[0] === 'all')) {
      return `${f}特性通过${mapping.reason}得到完美验证`;
    }
    return `${f}在极限运动中被充分展现`;
  }).join('，');
  
  // 3. 商品特写提示词
  const productCloseup = `【产品特写】${name}的${features[0]}细节清晰可见，品牌标识${brand || '醒目展示'}，产品材质质感、光泽、色彩在极限运动场景中被高光呈现，产品不是背景道具而是画面核心主角。`;
  
  // 4. 消费场景暗示
  const consumptionCue = shotType === 'consume' 
    ? `【消费场景】运动员在极限动作中自然使用${name}，产品使用过程流畅自然，产品功效即时可见。` 
    : `【产品存在】${name}与运动员形影不离，是极限运动不可或缺的装备。`;
  
  // 5. 品牌Slogan融入
  const sloganCue = slogan ? `【品牌主张】${slogan}通过极限运动画面得到视觉化诠释。` : '';
  
  // 6. 产品相关音效暗示
  const productAudio = `【产品音效】${name}相关的声音细节：${features[0] === '防水' ? '水花溅在产品上的清脆声' : features[0] === '能量' ? '产品开启的清脆声/液体流动声' : '产品材质在极限运动中的独特声响'}。`;
  
  // 7. 光线聚焦产品
  const lightingFocus = `【产品打光】主光源从45度角打在${name}上，产品表面高光和阴影层次分明，边缘光(rim light)勾勒产品轮廓，产品比运动员更亮。`;
  
  // 组合所有商品元素
  const productHeroBlock = [
    heroOpening,
    featureFusion,
    productCloseup,
    consumptionCue,
    sloganCue,
    productAudio,
    lightingFocus
  ].filter(Boolean).join(' | ');
  
  // 将商品信息融入基础 prompt
  // 策略：将商品信息放在前半段（确保在截断时保留），基础镜头放在后半段
  return productHeroBlock + ' | ' + basePrompt;
}

/**
 * 商品卖点自动分析器
 * 从产品名称/描述提取关键卖点
 */
function analyzeProductFeatures(productName, productDesc = '') {
  const name = productName.toLowerCase();
  const desc = productDesc.toLowerCase();
  const combined = name + ' ' + desc;
  
  // 检查预设产品（更宽松的匹配：去除空格、统一小写）
  const normalizedCombined = combined.replace(/\s+/g, '').replace(/[\/\.\-]/g, '');
  for (const [key, info] of Object.entries(PRODUCT_SELLING_POINTS)) {
    const normalizedKey = key.replace(/\s+/g, '').replace(/[\/\.\-]/g, '').toLowerCase();
    if (normalizedCombined.includes(normalizedKey) || normalizedKey.includes(normalizedCombined.substring(0, 10))) {
      return { matched: true, source: 'preset', ...info };
    }
  }
  
  // 别名映射（常见品牌变体）
  const ALIASES = {
    'redbull': ['red bull', '红牛', 'redbull'],
    'gopro': ['go pro', 'hero', '运动相机'],
    'nike': ['耐克', 'air', 'zoom', 'dunk'],
    'adidas': ['阿迪达斯', 'boost', '三叶草'],
    'dji': ['大疆', '无人机', 'mavic', 'mini'],
    'applewatch': ['apple watch', 'iwatch', '苹果手表', '智能手表'],
    'loreal': ['欧莱雅', '防晒', '小金瓶', 'anessa', '安耐晒'],
    'bmw': ['宝马', 'bimmer'],
    'thenorthface': ['北面', '北脸', 'tnf', 'north face']
  };
  
  for (const [key, aliases] of Object.entries(ALIASES)) {
    for (const alias of aliases) {
      if (normalizedCombined.includes(alias.replace(/\s+/g, ''))) {
        return { matched: true, source: 'alias', ...PRODUCT_SELLING_POINTS[key] };
      }
    }
  }
  
  // 自动特征提取（基于关键词匹配）
  const features = [];
  const keywords = {
    '能量': ['能量', '能量饮料', '功能饮料', '提神', '耐力', '持久'],
    '防水': ['防水', '防泼', '水下', '游泳', '潜水', '冲浪'],
    '耐用': ['耐用', '坚固', '抗摔', '防护', '三防', '军工'],
    '轻便': ['轻便', '轻量', '轻量化', '超薄', '便携'],
    '速度': ['速度', '极速', '快速', '加速', '竞速', '赛车'],
    '专业': ['专业', '竞技', '赛事', '冠军', '运动员'],
    '时尚': ['时尚', '潮流', '设计', '颜值', '个性', '穿搭'],
    '智能': ['智能', '科技', '数码', 'AI', '芯片', '传感器'],
    '天然': ['天然', '有机', '绿色', '环保', '可持续', '健康'],
    '高端': ['高端', '奢华', '顶级', '限量', '定制', '尊贵']
  };
  
  for (const [feature, words] of Object.entries(keywords)) {
    if (words.some(w => combined.includes(w))) {
      features.push(feature);
    }
  }
  
  // 默认特征
  if (features.length === 0) {
    features.push('极限挑战', '突破自我');
  }
  
  return {
    matched: false,
    source: 'auto',
    category: '通用产品',
    features: features.slice(0, 3),
    sports: ['alpine', 'surfing', 'skateboarding'], // 通用推荐
    heroShots: ['product_closeup', 'consume_mid_action']
  };
}

// 导出商品主角引擎
module.exports.PRODUCT_SELLING_POINTS = PRODUCT_SELLING_POINTS;
module.exports.FEATURE_TO_SPORT_MAP = FEATURE_TO_SPORT_MAP;
module.exports.PRODUCT_HERO_SHOTS = PRODUCT_HERO_SHOTS;
module.exports.generateProductHeroPrompt = generateProductHeroPrompt;
module.exports.analyzeProductFeatures = analyzeProductFeatures;

// ==================== 商品主角模式注入扩充引擎 ====================

// 保存原始 expandPrompt 的引用
const _originalExpandPrompt = expandPrompt;

/**
 * 商品主角模式扩充：在标准扩充基础上叠加商品信息
 */
function expandPromptWithProduct(basePrompt, sport, angle, intensity, productInfo = null) {
  // 1. 先进行标准扩充
  let expanded = _originalExpandPrompt(basePrompt, sport, angle, intensity);
  
  // 2. 如果提供了商品信息，叠加商品主角模式
  if (productInfo) {
    const productHeroBlock = generateProductHeroPrompt(expanded, productInfo, 'consume', sport);
    // 3. 重新截断确保不超过1500
    expanded = truncateToLength(productHeroBlock, PROMPT_MAX_CHARS);
  }
  
  // 🛡️ 【v0.7.3-fix】PromptGuardian 自动修复
  try {
    const { PromptGuardian } = require('./scripts/prompt-guardian');
    const guardian = new PromptGuardian();
    const fixResult = guardian.autoFix(expanded, []);
    if (fixResult.changed) {
      console.log(`  🛡️ PromptGuardian[商品模式]: 自动修复 ${fixResult.fixes.length} 处`);
      for (const fix of fixResult.fixes) {
        console.log(`     ${fix.type}: ${fix.action}`);
      }
    }
    expanded = fixResult.prompt;
  } catch (e) {
    console.warn(`  ⚠️ PromptGuardian加载失败: ${e.message}`);
  }
  
  return expanded;
}

// 导出带商品功能的扩充
module.exports.expandPromptWithProduct = expandPromptWithProduct;

// ==================== 商品植入引擎类 ====================

class ProductPlacementEngine {
  constructor() {
    this.products = PRODUCT_SELLING_POINTS;
    this.featureMap = FEATURE_TO_SPORT_MAP;
    this.heroShots = PRODUCT_HERO_SHOTS;
  }
  
  /**
   * 分析商品并推荐最佳极限运动场景
   */
  analyze(productName, productDesc = '') {
    return analyzeProductFeatures(productName, productDesc);
  }
  
  /**
   * 为商品生成最佳短片配置
   */
  generateProductShort(productName, productDesc = '', options = {}) {
    const analysis = this.analyze(productName, productDesc);
    const duration = options.duration || 15;
    
    // 选择最佳运动类型（取前3个推荐运动）
    const recommendedSports = analysis.sports.slice(0, 3);
    
    // 为每个推荐运动生成短片配置
    const shorts = recommendedSports.map(sport => {
      const short = engine.generateXtremeShort({ 
        sport, 
        sequence: 'adrenaline', 
        duration: Math.ceil(duration / recommendedSports.length),
        expand: true
      });
      
      // 叠加商品主角信息
      const heroShots = short.shots.map(shot => {
        const productPrompt = generateProductHeroPrompt(
          shot.prompt, 
          { name: productName, features: analysis.features, brand: productName },
          'consume',
          sport
        );
        const truncated = truncateToLength(productPrompt, PROMPT_MAX_CHARS);
        const check = checkPromptLength(truncated);
        
        return {
          ...shot,
          prompt: truncated,
          productMode: true,
          productFeatures: analysis.features,
          promptLength: check.length,
          promptStatus: check.status
        };
      });
      
      return {
        sport: short.sport,
        shots: heroShots,
        productFeatures: analysis.features,
        productReason: this.featureMap[analysis.features[0]]?.reason || '极限运动场景展示产品特性'
      };
    });
    
    return {
      product: productName,
      analysis,
      recommendedSports: recommendedSports.map(s => XTREME_SHOTS[s]?.name || s),
      shorts,
      totalDuration: shorts.reduce((sum, s) => sum + s.shots.length * 3, 0),
      strategy: '商品主角模式：产品占据视觉焦点30-50%，极限运动为展示舞台'
    };
  }
  
  /**
   * 获取商品推荐镜头类型
   */
  getRecommendedShots(productName, productDesc = '') {
    const analysis = this.analyze(productName, productDesc);
    return analysis.heroShots.map(id => ({
      id,
      ...this.heroShots[id]
    }));
  }
  
  /**
   * 生成商品卖点融合提示词
   */
  generateProductPrompt(productName, features, basePrompt, sport) {
    return generateProductHeroPrompt(basePrompt, { name: productName, features }, 'consume', sport);
  }
}

// 导出商品植入引擎
module.exports.ProductPlacementEngine = ProductPlacementEngine;

// ==================== 主链路引擎 (原有代码继续) ====================

class ShortVideoEngine {
  constructor() {
    this.version = VERSION;
    this.xtremeLibrary = new XtremeShotLibrary();
    this.productEngine = new ProductPlacementEngine();  // 商品主角引擎
    this.config = {
      defaultDuration: 15,
      defaultSport: 'alpine',
      defaultSequence: 'adrenaline',
      maxIntensity: 10,
      minIntensity: 7
    };
  }

  // 获取版本信息
  getVersion() {
    return this.version;
  }

  // 获取引擎状态（含扩充信息）
  getStatus() {
    const totalShots = Object.values(XTREME_SHOTS).reduce((sum, sport) => sum + sport.shots.length, 0);
    
    // 统计各运动类型的平均prompt长度
    const sportStats = {};
    for (const [sportId, sport] of Object.entries(XTREME_SHOTS)) {
      const avgLen = sport.shots.reduce((sum, s) => sum + s.prompt.length, 0) / sport.shots.length;
      sportStats[sportId] = {
        name: sport.name,
        baseAvgLength: Math.round(avgLen),
        expandedTarget: PROMPT_TARGET_CHARS
      };
    }
    
    return {
      version: this.version.full,
      features: this.version.features,
      xtremeSports: this.xtremeLibrary.getSports().map(s => s.name),
      angles: this.xtremeLibrary.getAngles().map(a => a.name),
      sequences: Object.keys(COMBO_SEQUENCES),
      totalShots: totalShots,
      config: this.config,
      // 扩充系统信息
      promptExpansion: {
        enabled: true,
        maxChars: PROMPT_MAX_CHARS,
        minChars: PROMPT_MIN_CHARS,
        targetChars: PROMPT_TARGET_CHARS,
        baseAvgLength: 100, // 基础prompt平均约100字符
        expansionRatio: Math.round(PROMPT_TARGET_CHARS / 100), // 约15倍扩充
        dimensions: ['视觉场景', '运镜指令', '技术参数', '质感风格', '环境音效', '时间感知', '氛围情绪'],
        sportStats: sportStats
      }
    };
  }

  // ==================== 极限运动短片生成 ====================

  /**
   * 生成极限运动短片配置（带扩充）
   * @param {Object} options - 配置选项
   * @param {string} options.sport - 运动类型 (alpine, skydiving, surfing, skateboarding, bmx, climbing, motocross, parkour)
   * @param {string} options.sequence - 组合序列 (classic, adrenaline, slowmo, immersive, cinematic)
   * @param {number} options.duration - 目标时长 (秒)
   * @param {string} options.angle - 指定视角 (pov, follow, side, top, low)
   * @param {number} options.intensity - 最低强度 (1-10)
   * @param {boolean} options.expand - 是否启用扩充（默认true）
   * @returns {Object} 完整短片配置（含扩充prompt）
   */
  generateXtremeShort(options = {}) {
    const {
      sport = this.config.defaultSport,
      sequence = this.config.defaultSequence,
      duration = this.config.defaultDuration,
      angle = null,
      intensity = this.config.minIntensity,
      expand = true  // 默认启用扩充
    } = options;

    console.log(`🎬 生成极限运动短片: ${sport} | ${sequence} | ${duration}秒 | 扩充: ${expand ? 'ON' : 'OFF'}`);

    // 如果指定了视角，生成单视角短片
    if (angle) {
      return this.generateSingleAngleShort({ sport, angle, duration, intensity, expand });
    }

    // 生成组合序列短片
    const sequenceConfig = this.xtremeLibrary.generateShortVideoShots({
      sport,
      sequence,
      totalDuration: duration
    });
    
    // 扩充每个镜头的 prompt
    const expandedShots = sequenceConfig.shots.map(shot => {
      const expandedPrompt = expand 
        ? expandPrompt(shot.prompt, sport, shot.angle, shot.intensity)
        : shot.prompt;
      const lengthCheck = checkPromptLength(expandedPrompt);
      
      return {
        ...shot,
        prompt: expandedPrompt,
        promptLength: lengthCheck.length,
        promptStatus: lengthCheck.status,
        promptRatio: lengthCheck.ratio,
        expanded: expand
      };
    });
    
    // 统计信息
    const totalLength = expandedShots.reduce((sum, s) => sum + s.promptLength, 0);
    const avgLength = Math.round(totalLength / expandedShots.length);
    const allPassed = expandedShots.every(s => s.promptStatus === 'ok');
    
    return {
      type: 'xtreme-sequence',
      version: this.version.full,
      generatedAt: new Date().toISOString(),
      sport: XTREME_SHOTS[sport]?.name || sport,
      sequence: COMBO_SEQUENCES[sequence]?.name || sequence,
      duration,
      expand,
      shots: expandedShots,
      totalShots: expandedShots.length,
      avgIntensity: expandedShots.reduce((sum, s) => sum + s.intensity, 0) / expandedShots.length,
      avgPromptLength: avgLength,
      totalPromptLength: totalLength,
      allPromptsPassed: allPassed,
      prompts: expandedShots.map(s => s.prompt),
      promptLengths: expandedShots.map(s => s.promptLength),
      promptStatuses: expandedShots.map(s => s.promptStatus)
    };
  }

  /**
   * 生成单视角短片（带扩充）
   */
  generateSingleAngleShort(options = {}) {
    const {
      sport = this.config.defaultSport,
      angle = 'pov',
      duration = this.config.defaultDuration,
      intensity = this.config.minIntensity,
      expand = true
    } = options;

    const shots = this.xtremeLibrary.getShotsBySport(sport)
      .filter(s => s.angle === angle && s.intensity >= intensity);

    if (shots.length === 0) {
      return { error: `没有找到 ${sport} 的 ${angle} 视角镜头` };
    }

    // 按强度排序，取前几个填满时长
    const selected = [];
    let currentTime = 0;
    
    for (const shot of shots.sort((a, b) => b.intensity - a.intensity)) {
      if (currentTime >= duration) break;
      selected.push({
        ...shot,
        startTime: currentTime,
        duration: shot.duration
      });
      currentTime += shot.duration;
    }
    
    // 扩充
    const expandedShots = selected.map(shot => {
      const expandedPrompt = expand
        ? expandPrompt(shot.prompt, sport, shot.angle, shot.intensity)
        : shot.prompt;
      const lengthCheck = checkPromptLength(expandedPrompt);
      
      return {
        ...shot,
        prompt: expandedPrompt,
        promptLength: lengthCheck.length,
        promptStatus: lengthCheck.status,
        promptRatio: lengthCheck.ratio,
        expanded: expand
      };
    });
    
    const totalLength = expandedShots.reduce((sum, s) => sum + s.promptLength, 0);
    const avgLength = Math.round(totalLength / expandedShots.length);

    return {
      type: 'xtreme-single-angle',
      version: this.version.full,
      generatedAt: new Date().toISOString(),
      sport: XTREME_SHOTS[sport]?.name || sport,
      angle: ANGLE_TYPES[angle]?.name || angle,
      totalDuration: currentTime,
      expand,
      shots: expandedShots,
      totalShots: expandedShots.length,
      avgIntensity: expandedShots.reduce((sum, s) => sum + s.intensity, 0) / expandedShots.length,
      avgPromptLength: avgLength,
      totalPromptLength: totalLength,
      allPromptsPassed: expandedShots.every(s => s.promptStatus === 'ok'),
      prompts: expandedShots.map(s => s.prompt),
      promptLengths: expandedShots.map(s => s.promptLength),
      promptStatuses: expandedShots.map(s => s.promptStatus)
    };
  }

  /**
   * 生成高肾上腺素短片（强度 >= 9）
   */
  generateAdrenalineRush(options = {}) {
    const { duration = 15 } = options;
    
    const highIntensityShots = this.xtremeLibrary.getShotsByIntensity(9);
    
    const selected = [];
    let currentTime = 0;
    
    // 随机打乱，确保多样性
    const shuffled = highIntensityShots.sort(() => Math.random() - 0.5);
    
    for (const shot of shuffled) {
      if (currentTime >= duration) break;
      selected.push({
        ...shot,
        startTime: currentTime,
        duration: shot.duration
      });
      currentTime += shot.duration;
    }

    return {
      type: 'adrenaline-rush',
      version: this.version.full,
      generatedAt: new Date().toISOString(),
      totalDuration: currentTime,
      shots: selected,
      totalShots: selected.length,
      avgIntensity: selected.reduce((sum, s) => sum + s.intensity, 0) / selected.length,
      prompts: selected.map(s => s.prompt),
      note: '🔥 高强度肾上腺素短片 - 所有镜头强度 >= 9/10'
    };
  }

  // ==================== 质量门检查 ====================

  /**
   * 质量门：检查 prompt 字符数
   * @param {Array} shots - 镜头数组
   * @returns {Object} 质量检查报告
   */
  qualityCheck(shots) {
    const checks = shots.map(shot => {
      const check = checkPromptLength(shot.prompt);
      return {
        id: shot.id,
        name: shot.name,
        angle: shot.angle,
        intensity: shot.intensity,
        ...check
      };
    });
    
    const passed = checks.filter(c => c.status === 'ok').length;
    const underLimit = checks.filter(c => c.status === 'under');
    const overflow = checks.filter(c => c.status === 'overflow');
    
    return {
      passed: passed === checks.length,
      total: checks.length,
      passed,
      underLimit: underLimit.length,
      overflow: overflow.length,
      avgLength: Math.round(checks.reduce((sum, c) => sum + c.length, 0) / checks.length),
      minLength: Math.min(...checks.map(c => c.length)),
      maxLength: Math.max(...checks.map(c => c.length)),
      details: checks,
      underLimitShots: underLimit.map(c => ({ name: c.name, length: c.length, target: c.target })),
      overflowShots: overflow.map(c => ({ name: c.name, length: c.length, max: c.max }))
    };
  }

  /**
   * 批量质量检查（多种运动类型）
   * @param {Array} configs - 配置数组 [{sport, sequence, duration}, ...]
   * @returns {Array} 质量检查报告数组
   */
  batchQualityCheck(configs) {
    const results = [];
    for (const config of configs) {
      const short = this.generateXtremeShort(config);
      const qc = this.qualityCheck(short.shots);
      results.push({
        config,
        ...qc,
        avgLength: short.avgPromptLength
      });
    }
    return results;
  }

  /**
   * 自动补全：如果 prompt 不足，自动补充通用描述
   * @param {string} prompt - 当前 prompt
   * @param {number} targetLength - 目标字符数
   * @returns {string} 补全后的 prompt
   */
  autoCompletePrompt(prompt, targetLength = PROMPT_TARGET_CHARS) {
    const currentLen = prompt.length;
    if (currentLen >= targetLength) return prompt;
    
    const padding = targetLength - currentLen;
    // 添加通用补充描述
    const supplements = [
      '超高清画质，8K分辨率，120fps高帧率拍摄，HDR高动态范围，色彩空间Rec.2020',
      '电影级叙事风格，极限运动纪录片质感，红牛风格高肾上腺素，国家地理级画面',
      '环境音效层次丰富：风声呼啸、引擎轰鸣、水花飞溅、心跳加速、呼吸急促',
      '时间感知：慢动作时间凝固，关键帧强调动作顶点，加速镜头压缩时间',
      '氛围情绪：肾上腺素飙升，突破极限成就感，自由飞翔解放感，征服恐惧勇气',
      '技术参数：ProRes 422 HQ编码，ISO 800-3200，快门180度，光圈f/2.8-f/5.6',
      '质感风格：胶片模拟Kodak Vision3 500T，35mm胶片颗粒，暗角轻微晕影',
      '动作细节：肌肉线条清晰可见，装备材质褶皱质感，阳光勾勒身体轮廓 rim light'
    ];
    
    let completed = prompt;
    let supplementIndex = 0;
    while (completed.length < targetLength && supplementIndex < supplements.length) {
      completed += ' | ' + supplements[supplementIndex];
      supplementIndex++;
    }
    
    // 如果还不够，添加填充文本
    if (completed.length < targetLength) {
      const fillText = '，细节丰富，质感强烈，视觉冲击力强，画面精美，构图专业，光影层次丰富，色彩饱满，动态范围宽广，焦点清晰，景深适中，运动模糊自然，颗粒质感胶片风格，后期调色专业，视觉效果震撼，极限运动美学，肾上腺素视觉盛宴';
      const repeatTimes = Math.ceil((targetLength - completed.length) / fillText.length);
      completed += fillText.repeat(repeatTimes);
    }
    
    return completed.substring(0, targetLength);
  }

  // ==================== 社媒营销短片生成（商品主角模式） ====================

  /**
   * 生成社媒营销短片 - 商品主角模式
   * 核心理念：产品才是主角，极限运动是展示产品的舞台
   * @param {Object} options - 配置
   * @param {string} options.product - 产品名称（必填）
   * @param {string} options.productDesc - 产品描述/卖点
   * @param {string} options.scene - 场景 (xtreme/极限运动/旅行/城市)
   * @param {number} options.duration - 时长
   * @param {boolean} options.heroMode - 是否启用商品主角模式（默认true）
   */
  generateSocialMediaShort(options = {}) {
    const { 
      product, 
      productDesc = '', 
      scene = 'xtreme', 
      duration = 15,
      heroMode = true  // 默认商品主角模式
    } = options;

    if (!product) {
      return { error: '❌ 必须指定产品名称！社媒短片的核心是卖产品。请提供 product 参数。' };
    }

    console.log(`🎯 商品主角模式生成: ${product} | 场景: ${scene} | 时长: ${duration}秒 | 商品主角: ${heroMode ? 'ON' : 'OFF'}`);

    // 分析产品卖点
    const analysis = this.productEngine.analyze(product, productDesc);
    console.log(`📊 产品分析: ${analysis.features.join('、')} | 类别: ${analysis.category}`);

    // 如果是极限运动场景且启用商品主角模式
    if ((scene === 'xtreme' || scene === '极限运动') && heroMode) {
      // 使用商品主角引擎生成
      const productShort = this.productEngine.generateProductShort(product, productDesc, { duration });
      
      // 为每个镜头叠加商品主角提示词
      const heroShots = productShort.shorts.flatMap(s => s.shots);
      
      return {
        type: 'social-media-product-hero',
        version: this.version.full,
        product: product,
        productDesc: productDesc,
        scene: '极限运动',
        heroMode: true,
        analysis: {
          category: analysis.category,
          features: analysis.features,
          matched: analysis.matched,
          source: analysis.source
        },
        recommendedSports: productShort.recommendedSports,
        strategy: productShort.strategy,
        totalDuration: productShort.totalDuration,
        shots: heroShots,
        totalShots: heroShots.length,
        avgIntensity: heroShots.reduce((sum, s) => sum + (s.intensity || 8), 0) / heroShots.length,
        avgPromptLength: Math.round(heroShots.reduce((sum, s) => sum + s.prompt.length, 0) / heroShots.length),
        allPromptsPassed: heroShots.every(s => s.promptStatus === 'ok'),
        prompts: heroShots.map(s => s.prompt),
        promptLengths: heroShots.map(s => s.promptLength),
        promptStatuses: heroShots.map(s => s.promptStatus),
        marketingNote: `🏆 ${product} 是主角！极限运动是展示 ${analysis.features.join('、')} 的舞台。`,
        productHeroPrinciples: [
          '产品占据画面视觉焦点30-50%',
          '产品特性通过极限运动场景得到验证',
          '品牌标识清晰可见',
          '产品不是背景道具而是画面核心主角',
          '光线聚焦产品，产品比运动员更亮',
          '音效突出产品相关声音细节'
        ]
      };
    }

    // 普通极限运动场景（不启用商品主角）
    if (scene === 'xtreme' || scene === '极限运动') {
      const xtremeConfig = this.generateXtremeShort({ duration, expand: true });
      
      return {
        type: 'social-media-xtreme',
        version: this.version.full,
        product: product,
        productDesc: productDesc,
        scene: '极限运动',
        heroMode: false,
        analysis: {
          category: analysis.category,
          features: analysis.features
        },
        ...xtremeConfig,
        marketingNote: `🏂 ${product} 融入极限运动场景 | 卖点: ${analysis.features.join('、')}`
      };
    }

    // 其他场景
    return {
      type: 'social-media',
      version: this.version.full,
      product: product,
      productDesc: productDesc,
      scene,
      duration,
      analysis: {
        category: analysis.category,
        features: analysis.features
      },
      marketingNote: `📱 ${product} 社媒短片 | 卖点: ${analysis.features.join('、')} | 场景: ${scene}`
    };
  }

  // ==================== 工具方法 ====================

  /**
   * 获取所有可用镜头
   */
  getAllShots() {
    return this.xtremeLibrary.getShotsByIntensity(1);
  }

  /**
   * 获取指定运动类型的镜头
   */
  getShotsBySport(sport) {
    return this.xtremeLibrary.getShotsBySport(sport);
  }

  /**
   * 获取指定视角的镜头
   */
  getShotsByAngle(angle) {
    return this.xtremeLibrary.getShotsByAngle(angle);
  }

  /**
   * 导出为 AI 视频生成提示词列表
   */
  exportPrompts(config) {
    if (!config || !config.shots) {
      return { error: '无效的短片配置' };
    }

    return config.shots.map((shot, index) => ({
      shotIndex: index + 1,
      duration: shot.duration,
      prompt: shot.prompt,
      intensity: shot.intensity,
      angle: shot.angle,
      sport: shot.sportName || config.sport
    }));
  }

  /**
   * 打印短片配置（用于调试）
   */
  printShort(config) {
    console.log('\n' + '='.repeat(60));
    console.log(`🎬 ${config.type?.toUpperCase() || 'SHORT'} VIDEO CONFIG`);
    console.log('='.repeat(60));
    console.log(`版本: ${config.version}`);
    console.log(`生成时间: ${config.generatedAt}`);
    console.log(`运动: ${config.sport || '混合'}`);
    console.log(`序列: ${config.sequence || '单视角'}`);
    console.log(`总时长: ${config.totalDuration}秒`);
    console.log(`镜头数: ${config.totalShots}`);
    console.log(`平均强度: ${config.avgIntensity?.toFixed(1)}/10`);
    console.log('-'.repeat(60));
    
    for (const shot of config.shots || []) {
      console.log(`\n🎥 ${shot.name || shot.id}`);
      console.log(`   时间: ${shot.startTime}s - ${shot.startTime + shot.duration}s`);
      console.log(`   视角: ${shot.angle} | 强度: ${shot.intensity}/10`);
      console.log(`   目的: ${shot.purpose || 'N/A'}`);
      console.log(`   提示词: ${shot.prompt.substring(0, 80)}...`);
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// ==================== 导出 ====================

module.exports = {
  ShortVideoEngine,
  VERSION,
  XtremeShotLibrary,
  XTREME_SHOTS,
  ANGLE_TYPES,
  COMBO_SEQUENCES
};

// 如果是直接运行，演示主链路
if (require.main === module) {
  const engine = new ShortVideoEngine();
  
  console.log('🩲 超短裙系统主链路引擎');
  console.log('='.repeat(60));
  console.log(`版本: ${engine.version.full}`);
  console.log(`发布日期: ${engine.version.releaseDate}`);
  console.log('\n核心特性:');
  engine.version.features.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 引擎状态:');
  const status = engine.getStatus();
  console.log(`  极限运动: ${status.xtremeSports.join(' | ')}`);
  console.log(`  视角类型: ${status.angles.join(' | ')}`);
  console.log(`  组合序列: ${status.sequences.join(' | ')}`);
  console.log(`  总镜头数: ${status.totalShots}`);
  
  console.log('\n' + '='.repeat(60));
  console.log('🎬 演示: 生成 15秒 高山滑雪肾上腺素短片');
  const short = engine.generateXtremeShort({ 
    sport: 'alpine', 
    sequence: 'adrenaline', 
    duration: 15 
  });
  engine.printShort(short);
  
  console.log('\n' + '='.repeat(60));
  console.log('🔥 演示: 生成高肾上腺素短片 (强度>=9)');
  const rush = engine.generateAdrenalineRush({ duration: 10 });
  engine.printShort(rush);
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ 超短裙系统 v0.7.0-xtreme-integrated 就绪！');
  console.log('💡 使用: const engine = require("./short-video-engine");');
}
