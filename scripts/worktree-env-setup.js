#!/usr/bin/env node

/**
 * postinstall script — auto-generates a .env file when the repo lives
 * inside a worktree directory (e.g. worktrees/<name>/).
 *
 * Port assignment is deterministic: sibling folders are sorted by
 * creation time (birthtime) and each gets BASE_PORT + index * PORT_STEP.
 */

const fs = require('fs');
const path = require('path');

const BASE_PORT = 4700;
const PORT_STEP = 10;

const repoRoot = path.resolve(__dirname, '..');
const envPath = path.join(repoRoot, '.env');

// 1. Never overwrite an existing .env
if (fs.existsSync(envPath)) {
  process.exit(0);
}

const parentDir = path.resolve(repoRoot, '..');
const repoFolderName = path.basename(repoRoot);

// 2. Detect worktree context — parent must contain multiple sibling dirs
//    that look like git repos (have a .git file or directory).
let siblings;
try {
  siblings = fs
    .readdirSync(parentDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => {
      const gitPath = path.join(parentDir, name, '.git');
      try {
        fs.statSync(gitPath);
        return true;
      } catch {
        return false;
      }
    });
} catch {
  // Can't read parent — not a worktree setup.
  process.exit(0);
}

if (siblings.length < 2) {
  // Only one repo dir in the parent — not a worktree setup.
  process.exit(0);
}

// 3. Sort siblings by creation time (birthtime) for deterministic ordering.
const sorted = siblings
  .map((name) => ({
    name,
    birthtime: fs.statSync(path.join(parentDir, name)).birthtime,
  }))
  .sort((a, b) => a.birthtime - b.birthtime)
  .map((entry) => entry.name);

const index = sorted.indexOf(repoFolderName);
if (index === -1) {
  // Shouldn't happen, but bail out safely.
  process.exit(0);
}

// 4. Calculate port and write .env
const port = BASE_PORT + index * PORT_STEP;
const homePath = path.join(repoRoot, '.dungeonmaster-home');

const content = [
  `DUNGEONMASTER_PORT=${port}`,
  `DUNGEONMASTER_HOME=${homePath}`,
  '',
].join('\n');

fs.writeFileSync(envPath, content, 'utf8');

// 5. Ensure .dungeonmaster-home directory exists
fs.mkdirSync(homePath, { recursive: true });

console.log(`[worktree-env-setup] Generated .env — port=${port}, home=${homePath}`);
