#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const CLAUDE_DIR = '.claude';
const COMMANDS_DIR = path.join(CLAUDE_DIR, 'commands');
const CONFIG_FILE = '.questmaestro';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
} as const;

type ColorKey = keyof typeof colors;

function log(message: string, color: ColorKey = 'reset'): void {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function ensureDirectoryExists(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyCommands(): void {
  const sourceDir = path.join(__dirname, '..', '..', 'src', 'commands');
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
  
  questFiles.forEach(file => {
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

function installEslint(): void {
  try {
    log('    Installing ESLint...', 'blue');
    execSync('npm install --save-dev eslint @eslint/js', { stdio: 'inherit' });
    
    // Create a basic ESLint configuration
    const eslintConfig = {
      extends: ['@eslint/js/recommended'],
      env: {
        node: true,
        es2022: true
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      rules: {
        'no-unused-vars': 'warn',
        'no-console': 'off'
      }
    };
    
    fs.writeFileSync('.eslintrc.json', JSON.stringify(eslintConfig, null, 2));
    log('    ✓ ESLint installed and configured', 'green');
    
    // Add lint script to package.json if missing
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (!packageJson.scripts) packageJson.scripts = {};
    if (!packageJson.scripts.lint) {
      packageJson.scripts.lint = 'eslint . --ext .js,.ts,.jsx,.tsx';
      fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
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
  [key: string]: any;
}

function setupClaudeSettings(): void {
  const settingsPath = path.join(CLAUDE_DIR, 'settings.local.json');
  
  let settings: ClaudeSettings = {};
  let settingsExisted = false;
  
  // Read existing settings if file exists
  if (fs.existsSync(settingsPath)) {
    settingsExisted = true;
    try {
      const content = fs.readFileSync(settingsPath, 'utf8');
      settings = JSON.parse(content);
    } catch (error) {
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

function updateGitignore(): void {
  const gitignorePath = '.gitignore';
  const questmaestroEntries = [
    '# Questmaestro local quest folders',
    'questmaestro/active/',
    'questmaestro/completed/',
    'questmaestro/abandoned/'
  ];
  
  let gitignoreContent = '';
  if (fs.existsSync(gitignorePath)) {
    gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  }
  
  // Check if questmaestro entries already exist
  const hasQuestmaestroEntries = questmaestroEntries.some(entry => 
    gitignoreContent.includes(entry.replace('# ', '').trim())
  );
  
  if (!hasQuestmaestroEntries) {
    // Add questmaestro entries
    const entriesToAdd = gitignoreContent.length > 0 ? 
      '\n' + questmaestroEntries.join('\n') : 
      questmaestroEntries.join('\n');
    
    fs.writeFileSync(gitignorePath, gitignoreContent + entriesToAdd + '\n');
    log('  ✓ Added questmaestro folders to .gitignore', 'green');
  } else {
    log('  ⚠️  Questmaestro gitignore entries already exist, skipping...', 'yellow');
  }
}

function createConfig(): void {
  log('\n📜 Creating Configuration...', 'bright');
  
  // Create .questmaestro config
  if (fs.existsSync(CONFIG_FILE)) {
    log('  ⚠️  .questmaestro already exists, skipping...', 'yellow');
  } else {
    const templatePath = path.join(__dirname, '..', '..', 'src', 'templates', 'questmaestro.json');
    fs.copyFileSync(templatePath, CONFIG_FILE);
    log('  ✓ Created .questmaestro config file', 'green');
  }
  
  // Create questmaestro directory structure
  const questsDir = 'questmaestro';
  const activeDir = path.join(questsDir, 'active');
  const completedDir = path.join(questsDir, 'completed');
  const abandonedDir = path.join(questsDir, 'abandoned');
  const retrosDir = path.join(questsDir, 'retros');
  const loreDir = path.join(questsDir, 'lore');
  
  ensureDirectoryExists(questsDir);
  ensureDirectoryExists(activeDir);
  ensureDirectoryExists(completedDir);
  ensureDirectoryExists(abandonedDir);
  ensureDirectoryExists(retrosDir);
  ensureDirectoryExists(loreDir);
  log('  ✓ Created questmaestro directory structure', 'green');
  
  // Add lore categories guide
  const loreCategoriesPath = path.join(loreDir, 'README.md');
  if (!fs.existsSync(loreCategoriesPath)) {
    const categoriesTemplate = path.join(__dirname, '..', '..', 'src', 'templates', 'lore-categories.md');
    fs.copyFileSync(categoriesTemplate, loreCategoriesPath);
    log('  ✓ Added lore categories guide', 'green');
  }
  
  // Add gitignore entries for local quest folders
  updateGitignore();
  
  // Set up Claude settings for Write tool permission
  setupClaudeSettings();
}

function printInstructions(): void {
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
  eslintConfig?: any;
  jest?: any;
  [key: string]: any;
}

function validateProject(): void {
  log('\n🔍 Validating Project Requirements...', 'bright');
  
  // Check for package.json
  if (!fs.existsSync('package.json')) {
    throw new Error('No package.json found! Questmaestro requires a Node.js project.');
  }
  log('  ✓ package.json found', 'green');
  
  const packageJson: PackageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Check for ESLint configuration
  const eslintConfigs = [
    '.eslintrc',
    '.eslintrc.js',
    '.eslintrc.json',
    '.eslintrc.yml',
    '.eslintrc.yaml',
    'eslint.config.js',
    'eslint.config.mjs'
  ];
  
  const hasEslintFile = eslintConfigs.some(file => fs.existsSync(file));
  const hasEslintInPackage = packageJson.eslintConfig !== undefined;
  
  if (!hasEslintFile && !hasEslintInPackage) {
    log('  ⚠️  No ESLint configuration found, installing...', 'yellow');
    installEslint();
  } else {
    log('  ✓ ESLint configuration found', 'green');
  }
  
  // Check for Jest configuration
  const jestConfigs = [
    'jest.config.js',
    'jest.config.ts',
    'jest.config.mjs',
    'jest.config.cjs',
    'jest.config.json'
  ];
  
  const hasJestFile = jestConfigs.some(file => fs.existsSync(file));
  const hasJestInPackage = packageJson.jest !== undefined;
  
  if (!hasJestFile && !hasJestInPackage) {
    throw new Error('No Jest configuration found! Please set up Jest before installing Questmaestro.');
  }
  log('  ✓ Jest configuration found', 'green');
  
  // Check for required scripts
  const scripts = packageJson.scripts || {};
  const requiredScripts = ['lint', 'test'];
  const missingScripts = requiredScripts.filter(script => !scripts[script]);
  
  if (missingScripts.length > 0) {
    throw new Error(`Missing required scripts in package.json: ${missingScripts.join(', ')}`);
  }
  log('  ✓ Required scripts found', 'green');
}

function main(): void {
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
  } catch (error) {
    log(`\nError during installation: ${(error as Error).message}`, 'red');
    process.exit(1);
  }
}

// Run the installer
main();