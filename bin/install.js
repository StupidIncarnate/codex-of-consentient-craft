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
  
  // Copy quest sub-commands
  const questDir = path.join(sourceDir, 'quest');
  const questFiles = fs.readdirSync(questDir);
  
  questFiles.forEach(file => {
    if (file.endsWith('.md')) {
      const agentName = path.basename(file, '.md');
      const srcPath = path.join(questDir, file);
      const destPath = path.join(targetDir, `quest:${agentName}.md`);
      fs.copyFileSync(srcPath, destPath);
      log(`  ✓ Quest:${agentName}`, 'green');
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