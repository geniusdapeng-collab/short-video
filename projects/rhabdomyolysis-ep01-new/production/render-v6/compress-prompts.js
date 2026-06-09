const fs = require("fs");

const STORYBOARD_PATH = "/root/.openclaw/workspace/projects/rhabdomyolysis-ep01-new/storyboard-v6.json";
const RENDER_TASKS_PATH = "/root/.openclaw/workspace/projects/rhabdomyolysis-ep01-new/production/render-v6/render-tasks.json";

const storyboard = JSON.parse(fs.readFileSync(STORYBOARD_PATH, "utf8"));
const renderTasks = JSON.parse(fs.readFileSync(RENDER_TASKS_PATH, "utf8"));

console.log("✂️ 开始压缩Prompt字数到490字以内...\n");

let compressedCount = 0;

for (let i = 0; i < storyboard.shots.length; i++) {
  const shot = storyboard.shots[i];
  const task = renderTasks[i];
  
  if (shot.prompt.length > 490) {
    const originalLength = shot.prompt.length;
    // 截断到488字，留2字余量
    const compressed = shot.prompt.substring(0, 488);
    
    // 确保在句号处截断
    const lastPeriod = compressed.lastIndexOf("，");
    const finalCompressed = lastPeriod > 400 ? compressed.substring(0, lastPeriod) + "。" : compressed;
    
    shot.prompt = finalCompressed;
    task.prompt = finalCompressed;
    
    console.log(`${shot.id}: ${originalLength}字 → ${finalCompressed.length}字 ✅`);
    compressedCount++;
  } else {
    console.log(`${shot.id}: ${shot.prompt.length}字 ✅ 无需压缩`);
  }
}

// 保存
fs.writeFileSync(STORYBOARD_PATH, JSON.stringify(storyboard, null, 2), "utf8");
fs.writeFileSync(RENDER_TASKS_PATH, JSON.stringify(renderTasks, null, 2), "utf8");

console.log(`\n📊 压缩完成: ${compressedCount}/11镜已压缩`);
console.log("💾 已保存 storyboard-v6.json 和 render-tasks.json");
