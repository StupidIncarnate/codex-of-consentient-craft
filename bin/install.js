#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

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
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyCommands() {
  const sourceDir = path.join(__dirname, '..', 'src', 'commands');
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

function createConfig() {
  log('\n📜 Creating Configuration...', 'bright');
  
  // Create .questmaestro config
  if (fs.existsSync(CONFIG_FILE)) {
    log('  ⚠️  .questmaestro already exists, skipping...', 'yellow');
  } else {
    const templatePath = path.join(__dirname, '..', 'src', 'templates', 'questmaestro.json');
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
    const categoriesTemplate = path.join(__dirname, '..', 'src', 'templates', 'lore-categories.md');
    fs.copyFileSync(categoriesTemplate, loreCategoriesPath);
    log('  ✓ Added lore categories guide', 'green');
  }
  
  // Create quest-tracker.json in questmaestro folder
  const questTrackerPath = path.join(questsDir, 'quest-tracker.json');
  if (fs.existsSync(questTrackerPath)) {
    log('  ⚠️  quest-tracker.json already exists, skipping...', 'yellow');
  } else {
    const trackerPath = path.join(__dirname, '..', 'src', 'templates', 'quest-tracker.json');
    fs.copyFileSync(trackerPath, questTrackerPath);
    log('  ✓ Created questmaestro/quest-tracker.json', 'green');
  }
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
  log('  2. Add your quests to quest-tracker.json');
  log('  3. Start questing with /questmaestro');
  
  log('\n⚡ Quick Examples:', 'bright');
  log('  /questmaestro              - Work on next quest');
  log('  /questmaestro list         - See all your quests');
  log('  /questmaestro fix login    - Create new quest or work on existing');
  log('  /questmaestro start auth   - Jump to specific quest');
}

function validateProject() {
  log('\n🔍 Validating Project Requirements...', 'bright');
  
  // Check for package.json
  if (!fs.existsSync('package.json')) {
    throw new Error('No package.json found! Questmaestro requires a Node.js project.');
  }
  log('  ✓ package.json found', 'green');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
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
    throw new Error('No ESLint configuration found! Please set up ESLint before installing Questmaestro.');
  }
  log('  ✓ ESLint configuration found', 'green');
  
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

function main() {
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
    log(`\nError during installation: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the installer
main();