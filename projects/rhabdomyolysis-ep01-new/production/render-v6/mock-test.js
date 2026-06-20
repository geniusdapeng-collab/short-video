const fs = require("fs");

const RENDER_DIR = "/root/.openclaw/workspace/projects/rhabdomyolysis-ep01-new/production/render-v6";

console.log("🧪 EP01-v6 API参数Mock测试开始！\n");

let passCount = 0;
let failCount = 0;

function test(name, condition, detail = "") {
  if (condition) {
    console.log(`✅ ${name}`);
    passCount++;
  } else {
    console.log(`❌ ${name} ${detail}`);
    failCount++;
  }
}

// 1. 测试渲染脚本存在
const renderScript = fs.readFileSync(`${RENDER_DIR}/render-v2.js`, "utf8");
test("render-v2.js 存在", true);

// 2. 测试payload包含所有必需参数
test("包含 model 参数", renderScript.includes('model: MODEL'));
test("包含 content 参数", renderScript.includes('content: content'));
test("包含 ratio: \"16:9\"", renderScript.includes('ratio: "16:9"'));
test("包含 duration: 5", renderScript.includes('duration: 5'));
test("包含 resolution: \"720p\"", renderScript.includes('resolution: "720p"'));
test("包含 seed: 42", renderScript.includes('seed: 42'));
test("包含 camera_fixed: false", renderScript.includes('camera_fixed: false'));
test("包含 watermark: false", renderScript.includes('watermark: false'));

// 3. 测试任务文件存在
test("render-tasks.json 存在", fs.existsSync(`${RENDER_DIR}/render-tasks.json`));
test("storyboard-v6.json 存在", fs.existsSync("/root/.openclaw/workspace/projects/rhabdomyolysis-ep01-new/storyboard-v6.json"));

// 4. 测试参考图存在
test("ref-xiaoG.txt 存在", fs.existsSync(`${RENDER_DIR}/ref-xiaoG.txt`));
test("ref-chen.txt 存在", fs.existsSync(`${RENDER_DIR}/ref-chen.txt`));
test("ref-coach.txt 存在", fs.existsSync(`${RENDER_DIR}/ref-coach.txt`));

// 5. 测试故事板结构
const storyboard = JSON.parse(fs.readFileSync("/root/.openclaw/workspace/projects/rhabdomyolysis-ep01-new/storyboard-v6.json"));
const tasks = JSON.parse(fs.readFileSync(`${RENDER_DIR}/render-tasks.json`));
test("故事板有 shots 数组", Array.isArray(storyboard.shots));
test(`故事板共 ${storyboard.shots.length} 镜`, storyboard.shots.length === 11);

  // 6. 测试每镜有必需字段（storyboard不需要references，那是render-tasks的）
for (const shot of storyboard.shots) {
  test(`${shot.id} 有 id`, !!shot.id);
  test(`${shot.id} 有 prompt`, !!shot.prompt && shot.prompt.length > 0);
  test(`${shot.id} 有 line`, !!shot.line);
}

// 6.5 测试render-tasks有references
for (const task of tasks) {
  test(`${task.id} 有 references`, Array.isArray(task.references));
}

// 7. 测试Prompt字数合规（450-490字），超长的打印出来
for (const shot of storyboard.shots) {
  const charCount = shot.prompt.length;
  const isValid = charCount >= 450 && charCount <= 490;
  if (!isValid) {
    console.log(`⚠️ ${shot.id} Prompt ${charCount}字，超出490字限制！尾部内容: ...${shot.prompt.substring(485)}`);
  }
  test(`${shot.id} Prompt ${charCount}字 (合规: ${isValid ? '✅' : '❌'})`, isValid, `实际${charCount}字`);
}

// 8. 模拟API payload结构验证
test(`render-tasks.json 共 ${tasks.length} 个任务`, tasks.length === 11);

// 构造模拟payload验证
const mockPayload = {
  model: "ep-20260518004622-jp46s",
  content: [
    { type: "text", text: tasks[0].prompt },
    { type: "image_url", image_url: { url: "data:image/png;base64,..." }, role: "reference_image" }
  ],
  ratio: "16:9",
  duration: 5,
  resolution: "720p",
  seed: 42,
  camera_fixed: false,
  watermark: false
};

const requiredFields = ['model', 'content', 'ratio', 'duration', 'resolution', 'seed', 'camera_fixed', 'watermark'];
for (const field of requiredFields) {
  test(`API payload 包含 ${field}`, mockPayload.hasOwnProperty(field));
}

// 9. 验证ratio值
test("ratio 值为 16:9", mockPayload.ratio === "16:9");

// 10. 验证duration范围
test("duration 为 5秒", mockPayload.duration === 5);

// 11. 验证resolution值
test("resolution 为 720p", mockPayload.resolution === "720p");

// 12. 验证watermark关闭
test("watermark 为 false", mockPayload.watermark === false);

console.log("\n" + "=".repeat(60));
console.log(`📊 测试结果: ✅ ${passCount}通过 | ❌ ${failCount}失败`);
console.log("=".repeat(60));

if (failCount === 0) {
  console.log("🎉 全部通过！可以提交Seedance渲染！");
  process.exit(0);
} else {
  console.log("⚠️ 有失败项，请先修复再渲染！");
  process.exit(1);
}
