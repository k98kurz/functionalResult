#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const platformPaths = {
  claude: '.claude/skills/functional-result/SKILL.md',
  codex: '.agent/skills/functional-result/SKILL.md',
  cursor: '.cursor/skills/functional-result/SKILL.md',
  opencode: '.opencode/skills/functional-result/SKILL.md',
};

const defaultPath = '.agent/skills/functional-result/SKILL.md';

function exportSkill(platform) {
  const packageDir = path.join(__dirname, '..');
  const sourcePath = path.join(packageDir, 'SKILL.md');
  const targetPath = platformPaths[platform] || defaultPath;
  const targetFullPath = path.join(process.cwd(), targetPath);

  try {
    const targetDir = path.dirname(targetFullPath);
    fs.mkdirSync(targetDir, { recursive: true });
    fs.copyFileSync(sourcePath, targetFullPath);
    console.log(`Successfully exported SKILL.md to ${targetFullPath}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error exporting SKILL.md: ${error.message}`);
      process.exit(1);
    } else {
      console.error('Unknown error occurred');
      process.exit(1);
    }
  }
}

const platform = process.argv[2] || 'default';

if (platform === '--help' || platform === '-h' || platform === 'help') {
  console.log('Usage: npx export-functional-result-skill [platform]');
  console.log('');
  console.log('Platforms:');
  console.log('  claude   - Export to .claude/skills/functional-result/SKILL.md');
  console.log('  codex    - Export to .agent/skills/functional-result/SKILL.md');
  console.log('  cursor   - Export to .cursor/skills/functional-result/SKILL.md');
  console.log('  opencode - Export to .opencode/skills/functional-result/SKILL.md');
  console.log('  default  - Export to .agent/skills/functional-result/SKILL.md (default)');
  process.exit(0);
}

exportSkill(platform);
