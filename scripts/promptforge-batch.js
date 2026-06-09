// scripts/promptforge-batch.js - 父进程批量调度

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

function runWorker(file, attempt = 1, maxRetries = 2) {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      ['--expose-gc', path.join(__dirname, 'promptforge-worker.js'), file],
      {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env }
      }
    );

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', chunk => { stdout += chunk.toString(); });
    child.stderr.on('data', chunk => { stderr += chunk.toString(); });

    child.on('close', code => {
      // 如果失败且未达最大重试次数，自动重试
      if (code !== 0 && attempt < maxRetries) {
        console.log(`  [Batch] ⚠️ ${path.basename(file)} 失败，${attempt}/${maxRetries} 次重试...`);
        resolve(runWorker(file, attempt + 1, maxRetries));
      } else {
        resolve({
          file,
          code,
          stdout,
          stderr,
          attempts: attempt
        });
      }
    });
  });
}

async function main() {
  const targetDir = process.argv[2] || path.join(process.cwd(), 'output/prompts');

  if (!fs.existsSync(targetDir)) {
    console.error(`Directory not found: ${targetDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(targetDir)
    .filter(f => /\.(md|txt)$/i.test(f))
    .map(f => path.join(targetDir, f))
    .sort();

  const shotFiles = files.filter(f => /S\d+/i.test(path.basename(f)));

  if (!shotFiles.length) {
    console.log(`No shot files found in ${targetDir}`);
    process.exit(0);
  }

  const results = [];
  for (const file of shotFiles) {
    console.log(`\n=== Processing ${path.basename(file)} ===`);
    const res = await runWorker(file);
    results.push(res);

    if (res.stdout) console.log(res.stdout.trim());
    if (res.stderr) console.error(res.stderr.trim());

    await new Promise(r => setTimeout(r, 1500));
  }

  const failed = results.filter(r => r.code !== 0);
  const retried = results.filter(r => r.attempts > 1);

  console.log('\n=== Batch Summary ===');
  console.log(`Total: ${results.length}`);
  console.log(`Success: ${results.length - failed.length}`);
  console.log(`Failed: ${failed.length}`);
  if (retried.length) {
    console.log(`Retried: ${retried.length}`);
  }

  if (failed.length) {
    console.log('Failed files:');
    for (const f of failed) {
      console.log(`- ${f.file}`);
    }
    process.exit(1);
  }

  process.exit(0);
}

main();