#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Directory and file constants
const CLAUDE_DIR = '.claude';
const COMMANDS_DIR = path.join(CLAUDE_DIR, 'commands');
const CONFIG_FILE = '.questmaestro';
const PACKAGE_JSON = 'package.json';
const GITIGNORE_FILE = '.gitignore';
const SETTINGS_FILE = 'settings.local.json';

// Quest directory structure
const QUEST_DIR = 'questmaestro';
const QUEST_SUBDIRS = {
  active: 'active',
  completed: 'completed',
  abandoned: 'abandoned',
  retros: 'retros',
  lore: 'lore',
} as const;

// Gitignore entries
const GITIGNORE_ENTRIES = [
  '# Questmaestro local quest folders',
  'questmaestro/active/',
  'questmaestro/completed/',
  'questmaestro/abandoned/',
];

// ESLint configuration files
const ESLINT_CONFIG_FILES = [
  '.eslintrc',
  '.eslintrc.js',
  '.eslintrc.json',
  '.eslintrc.yml',
  '.eslintrc.yaml',
  'eslint.config.js',
  'eslint.config.mjs',
];

// Jest configuration files
const JEST_CONFIG_FILES = [
  'jest.config.js',
  'jest.config.ts',
  'jest.config.mjs',
  'jest.config.cjs',
  'jest.config.json',
];

// Default ESLint configuration
const DEFAULT_ESLINT_CONFIG = {
  extends: ['@eslint/js/recommended'],
  env: {
    node: true,
    es2022: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'off',
  },
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
} as const;

type ColorKey = keyof typeof colors;

function log(message: string, color: ColorKey = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function ensureDirectoryExists(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyCommands() {
  const sourceDir = getTemplatePath('commands');
  const targetDir = COMMANDS_DIR;

  log('\n⚔️  Installing Quest Commands...', 'bright');

  // Ensure .claude/commands directory exists
  ensureDirectoryExists(targetDir);

  // Copy main questmaestro command
  const questmaestroSrc = path.join(sourceDir, 'questmaestro.md');
  const questmaestroDest = path.join(targetDir, 'questmaestro.md');
  fs.copyFileSync(questmaestroSrc, questmaestroDest);
  log('  ✓ Questmaestro (main orchestrator)', 'green');

  // Copy quest sub-commands to quest/ subdirectory
  const questSourceDir = path.join(sourceDir, 'quest');
  const questTargetDir = path.join(targetDir, 'quest');

  // Check if quest directory exists
  if (!fs.existsSync(questSourceDir)) {
    log(`  ❌ Quest directory not found: ${questSourceDir}`, 'red');
    throw new Error(`Quest directory not found: ${questSourceDir}`);
  }

  // Create quest subdirectory in target
  ensureDirectoryExists(questTargetDir);

  const questFiles = fs.readdirSync(questSourceDir);

  questFiles.forEach((file) => {
    if (file.endsWith('.md')) {
      const agentName = path.basename(file, '.md');
      const srcPath = path.join(questSourceDir, file);
      const destPath = path.join(questTargetDir, file);

      // Verify source file exists
      if (!fs.existsSync(srcPath)) {
        log(`  ❌ Source file not found: ${srcPath}`, 'red');
        throw new Error(`Source file not found: ${srcPath}`);
      }

      fs.copyFileSync(srcPath, destPath);
      log(`  ✓ quest:${agentName}`, 'green');
    }
  });
}

function installEslint() {
  try {
    log('    Installing ESLint...', 'blue');
    execSync('npm install --save-dev eslint @eslint/js', { stdio: 'inherit' });

    fs.writeFileSync('.eslintrc.json', JSON.stringify(DEFAULT_ESLINT_CONFIG, null, 2));
    log('    ✓ ESLint installed and configured', 'green');

    // Add lint script to package.json if missing
    const packageJson = getPackageJson();
    if (!packageJson.scripts) packageJson.scripts = {};
    if (!packageJson.scripts.lint) {
      packageJson.scripts.lint = 'eslint . --ext .js,.ts,.jsx,.tsx';
      fs.writeFileSync(PACKAGE_JSON, JSON.stringify(packageJson, null, 2));
      packageJsonCache = null; // Clear cache after modification
      log('    ✓ Added lint script to package.json', 'green');
    }
  } catch (error) {
    log(`    ❌ Failed to install ESLint: ${(error as Error).message}`, 'red');
    throw new Error('ESLint installation failed');
  }
}

interface ClaudeSettings {
  permissions?: {
    allow?: string[];
  };
  [key: string]: unknown;
}

function setupClaudeSettings() {
  const settingsPath = path.join(CLAUDE_DIR, SETTINGS_FILE);

  let settings: ClaudeSettings = {};
  let settingsExisted = false;

  // Read existing settings if file exists
  if (fs.existsSync(settingsPath)) {
    settingsExisted = true;
    try {
      const content = fs.readFileSync(settingsPath, 'utf8');
      settings = JSON.parse(content) as ClaudeSettings;
    } catch (_error) {
      log(`  ⚠️  Could not parse existing settings.local.json, creating backup...`, 'yellow');
      fs.copyFileSync(settingsPath, settingsPath + '.backup');
      settings = {};
    }
  }

  // Ensure permissions structure exists
  if (!settings.permissions) {
    settings.permissions = {};
  }
  if (!settings.permissions.allow) {
    settings.permissions.allow = [];
  }

  // Check if Write permission already exists
  if (!settings.permissions.allow.includes('Write')) {
    settings.permissions.allow.push('Write');

    // Write updated settings
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');

    if (settingsExisted) {
      log('  ✓ Added Write permission to existing .claude/settings.local.json', 'green');
    } else {
      log('  ✓ Created .claude/settings.local.json with Write permission', 'green');
    }
  } else {
    log('  ⚠️  Write permission already configured in settings.local.json', 'yellow');
  }
}

function updateGitignore() {
  const gitignorePath = GITIGNORE_FILE;

  let gitignoreContent = '';
  if (fs.existsSync(gitignorePath)) {
    gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  }

  // Check if questmaestro entries already exist
  const hasQuestmaestroEntries = GITIGNORE_ENTRIES.some((entry) =>
    gitignoreContent.includes(entry.replace('# ', '').trim()),
  );

  if (!hasQuestmaestroEntries) {
    // Add questmaestro entries
    const entriesToAdd =
      gitignoreContent.length > 0
        ? '\n' + GITIGNORE_ENTRIES.join('\n')
        : GITIGNORE_ENTRIES.join('\n');

    fs.writeFileSync(gitignorePath, gitignoreContent + entriesToAdd + '\n');
    log('  ✓ Added questmaestro folders to .gitignore', 'green');
  } else {
    log('  ⚠️  Questmaestro gitignore entries already exist, skipping...', 'yellow');
  }
}

function createConfig() {
  log('\n📜 Creating Configuration...', 'bright');

  // Create .questmaestro config
  if (fs.existsSync(CONFIG_FILE)) {
    log('  ⚠️  .questmaestro already exists, skipping...', 'yellow');
  } else {
    const templatePath = getTemplatePath('templates/questmaestro.json');
    fs.copyFileSync(templatePath, CONFIG_FILE);
    log('  ✓ Created .questmaestro config file', 'green');
  }

  // Create questmaestro directory structure
  ensureDirectoryExists(QUEST_DIR);
  Object.values(QUEST_SUBDIRS).forEach((subdir) => {
    ensureDirectoryExists(path.join(QUEST_DIR, subdir));
  });
  log('  ✓ Created questmaestro directory structure', 'green');

  // Add lore categories guide
  const loreCategoriesPath = path.join(QUEST_DIR, QUEST_SUBDIRS.lore, 'README.md');
  if (!fs.existsSync(loreCategoriesPath)) {
    const categoriesTemplate = getTemplatePath('templates/lore-categories.md');
    fs.copyFileSync(categoriesTemplate, loreCategoriesPath);
    log('  ✓ Added lore categories guide', 'green');
  }

  // Add gitignore entries for local quest folders
  updateGitignore();

  // Set up Claude settings for Write tool permission
  setupClaudeSettings();
}

function printInstructions() {
  log('\n🏰 Quest System Installed!', 'bright');
  log('\nAvailable Commands:', 'blue');
  log('  /questmaestro              - Main orchestrator');
  log('  /questmaestro <task>       - Work on specific task');
  log('  /quest:pathseeker <task>   - Map dependencies & discover paths');
  log('  /quest:codeweaver <task>   - Implement services');
  log('  /quest:lawbringer <task>   - Review code quality');
  log('  /quest:siegemaster <task>  - Create integration tests');
  log('  /quest:spiritmender <task> - Fix build errors');
  log('  /quest:taskweaver <task>   - Generate task definitions');

  log('\n📚 Next Steps:', 'yellow');
  log('  1. Edit .questmaestro to configure for your project');
  log('  2. Start questing with /questmaestro <task-description>');

  log('\n⚡ Quick Examples:', 'bright');
  log('  /questmaestro              - Work on next quest');
  log('  /questmaestro list         - See all your quests');
  log('  /questmaestro fix login    - Create new quest or work on existing');
  log('  /questmaestro start auth   - Jump to specific quest');
}

interface PackageJson {
  scripts?: Record<string, string>;
  eslintConfig?: Record<string, unknown>;
  jest?: Record<string, unknown>;
  [key: string]: unknown;
}

// Cache for package.json to avoid multiple reads
let packageJsonCache: PackageJson | null = null;

function getPackageJson() {
  if (!packageJsonCache) {
    if (!fs.existsSync(PACKAGE_JSON)) {
      throw new Error('No package.json found! Questmaestro requires a Node.js project.');
    }
    packageJsonCache = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8')) as PackageJson;
  }
  return packageJsonCache;
}

function getTemplatePath(relativePath: string) {
  // Try to find template in both development and compiled locations
  let templatePath = path.join(__dirname, '..', 'src', relativePath);
  if (!fs.existsSync(templatePath)) {
    templatePath = path.join(__dirname, '..', '..', 'src', relativePath);
  }
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${relativePath}`);
  }
  return templatePath;
}

function validateProject() {
  log('\n🔍 Validating Project Requirements...', 'bright');

  // Check for package.json and load it
  const packageJson = getPackageJson();
  log('  ✓ package.json found', 'green');

  // Check for ESLint configuration
  const hasEslintFile = ESLINT_CONFIG_FILES.some((file) => fs.existsSync(file));
  const hasEslintInPackage = packageJson.eslintConfig !== undefined;

  if (!hasEslintFile && !hasEslintInPackage) {
    log('  ⚠️  No ESLint configuration found, installing...', 'yellow');
    installEslint();
  } else {
    log('  ✓ ESLint configuration found', 'green');
  }

  // Check for Jest configuration
  const hasJestFile = JEST_CONFIG_FILES.some((file) => fs.existsSync(file));
  const hasJestInPackage = packageJson.jest !== undefined;

  if (!hasJestFile && !hasJestInPackage) {
    throw new Error(
      'No Jest configuration found! Please set up Jest before installing Questmaestro.',
    );
  }
  log('  ✓ Jest configuration found', 'green');

  // Check for required scripts
  const scripts = packageJson.scripts || {};
  const requiredScripts = ['lint', 'test'];
  const missingScripts = requiredScripts.filter((script) => !scripts[script]);

  if (missingScripts.length > 0) {
    throw new Error(`Missing required scripts in package.json: ${missingScripts.join(', ')}`);
  }
  log('  ✓ Required scripts found', 'green');
}

export function main() {
  log('🗡️  Questmaestro Installation', 'bright');
  log('================================\n', 'bright');

  try {
    // Check if we're in a directory with .claude
    if (!fs.existsSync(CLAUDE_DIR)) {
      log('Error: No .claude directory found!', 'red');
      log('Please run this from a directory with Claude configured.', 'red');
      process.exit(1);
    }

    // Validate project requirements
    validateProject();

    copyCommands();
    createConfig();
    printInstructions();

    log('\n✨ May your quests be swift and your builds always green! ✨\n', 'bright');
  } catch (_error) {
    const error = _error as Error;
    log(`\nError during installation: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the installer if called directly
if (require.main === module) {
  main();
}
