#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const platformPaths = {
  claude: '.claude/skills/functional-result/SKILL.md',
  codex: '.agent/skills/functional-result/SKILL.md',
  cursor: '.cursor/skills/functional-result/SKILL.md',
  opencode: '.opencode/skills/functional-result/SKILL.md',
};

const defaultPath = '.agent/skills/functional-result/SKILL.md';

export function getSourcePath() {
  return path.join(__dirname, '..', 'SKILL.md');
}

export function getTargetPath(platform) {
  return platformPaths[platform] || defaultPath;
}

export function runExport(sourcePath, targetFullPath) {
  const targetDir = path.dirname(targetFullPath);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.copyFileSync(sourcePath, targetFullPath);
  console.log(`Successfully exported SKILL.md to ${targetFullPath}`);
}

export function printHelp() {
  console.log('Usage: npx export-functional-result-skill [platform]');
  console.log('');
  console.log('Platforms:');
  console.log('  claude   - Export to .claude/skills/functional-result/SKILL.md');
  console.log('  codex    - Export to .agent/skills/functional-result/SKILL.md');
  console.log('  cursor   - Export to .cursor/skills/functional-result/SKILL.md');
  console.log('  opencode - Export to .opencode/skills/functional-result/SKILL.md');
  console.log('  default  - Export to .agent/skills/functional-result/SKILL.md (default)');
}

export function cli(args = []) {
  const platform = args[0] || 'default';
  if (platform === '--help' || platform === '-h' || platform === 'help') {
    printHelp();
    process.exit(0);
  }
  const sourcePath = getSourcePath();
  const targetRelPath = getTargetPath(platform);
  const targetFullPath = path.join(process.cwd(), targetRelPath);
  try {
    runExport(sourcePath, targetFullPath);
  } catch (error) {
    console.error(
      `Error exporting SKILL.md: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }
}

if (
  process.argv[1] &&
  fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  cli(process.argv.slice(2));
}
