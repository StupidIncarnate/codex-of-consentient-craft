#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { ConfigManager } from './core/config-manager';
import { QuestManager } from './core/quest-manager';
import { FileSystem } from './core/file-system';
import { Logger } from './utils/logger';
import { AgentSpawner } from './agents/agent-spawner';
import type { Quest } from './models/quest';
import { isError, isPackageJson, parseJsonSafely, isObject } from './utils/type-guards';

const logger = new Logger();
const fileSystem = new FileSystem();
const configManager = new ConfigManager(fileSystem);
const questManager = new QuestManager(fileSystem, configManager);

// Command handlers
const COMMANDS = {
  list: showQuestList,
  abandon: abandonCurrentQuest,
  start: (args: string[]) => startSpecificQuest(args),
  clean: cleanOldQuests,
  default: (args: string[]) => handleQuestOrCreate(args),
};

async function main() {
  try {
    // Check if .questmaestro config exists
    if (!fs.existsSync('.questmaestro')) {
      logger.error('No .questmaestro config found!');
      logger.info('Please run: npx questmaestro');
      process.exit(1);
    }

    // Auto-launch Voidpoker if needed
    await checkProjectDiscovery();

    // Parse command
    const args = process.argv.slice(2);
    const input = args.join(' ').trim();
    const command = detectCommand(input);

    // Execute command
    await command.handler(command.args);
  } catch (error: unknown) {
    logger.error(`Error: ${isError(error) ? error.message : String(error)}`);
    process.exit(1);
  }
}

function detectCommand(input: string): {
  type: string;
  handler: (args: string[]) => Promise<void> | void;
  args: string[];
} {
  if (!input) {
    return { type: 'default', handler: COMMANDS.default, args: [] };
  }

  const firstWord = input.split(' ')[0].toLowerCase();

  if (firstWord in COMMANDS && typeof COMMANDS[firstWord as keyof typeof COMMANDS] === 'function') {
    const args = input.split(' ').slice(1);
    return { type: firstWord, handler: COMMANDS[firstWord as keyof typeof COMMANDS], args };
  }

  return { type: 'default', handler: COMMANDS.default, args: [input] };
}

function showQuestList() {
  const quests = questManager.getAllQuests();

  if (quests.length === 0) {
    logger.info('No quests found. Start your first quest with: questmaestro <task>');
    return;
  }

  logger.bright('\n🏰 Your Quests:\n');

  const grouped = {
    active: quests.filter((q) => q.status === 'in_progress'),
    blocked: quests.filter((q) => q.status === 'blocked'),
    completed: quests.filter((q) => q.status === 'complete'),
    abandoned: quests.filter((q) => q.status === 'abandoned'),
  };

  if (grouped.active.length > 0) {
    logger.blue('Active:');
    grouped.active.forEach((q) => {
      logger.info(`  ${q.folder} - ${q.title}`);
    });
  }

  if (grouped.blocked.length > 0) {
    logger.yellow('\nBlocked:');
    grouped.blocked.forEach((q) => {
      logger.info(`  ${q.folder} - ${q.title}`);
    });
  }

  if (grouped.completed.length > 0) {
    logger.green('\nCompleted:');
    grouped.completed.forEach((q) => {
      logger.info(`  ${q.folder} - ${q.title}`);
    });
  }

  if (grouped.abandoned.length > 0) {
    logger.red('\nAbandoned:');
    grouped.abandoned.forEach((q) => {
      logger.info(`  ${q.folder} - ${q.title}`);
    });
  }
}

function abandonCurrentQuest() {
  const activeQuests = questManager.getActiveQuests();

  if (activeQuests.length === 0) {
    logger.info('No active quests to abandon.');
    return;
  }

  const quest = activeQuests[0];
  logger.info(`Abandoning quest: ${quest.title}`);

  questManager.abandonQuest(quest.folder, 'User requested abandonment');
  logger.success(`Quest "${quest.title}" has been abandoned.`);
}

async function startSpecificQuest(args: string[]) {
  if (args.length === 0) {
    logger.error('Please specify a quest name or ID');
    return;
  }

  const searchTerm = args.join(' ');
  const quest = questManager.findQuest(searchTerm);

  if (!quest.success || !quest.data) {
    logger.error(`No quest found matching: ${searchTerm}`);
    return;
  }

  logger.info(`Starting quest: ${quest.data.quest.title}`);
  await runQuest(quest.data.quest);
}

function cleanOldQuests() {
  const count = fileSystem.cleanOldQuests();
  logger.success(
    `🧹 Cleaned: ${count.completed} completed quests, ${count.abandoned} abandoned quests`,
  );
}

async function handleQuestOrCreate(args: string[]) {
  if (args.length === 0) {
    // Resume first active quest
    const activeQuests = questManager.getActiveQuests();
    if (activeQuests.length > 0) {
      const quest = questManager.getQuest(activeQuests[0].folder);
      if (quest) {
        await runQuest(quest);
      }
      return;
    }

    logger.info('No active quests. Start a new quest with: questmaestro <task>');
    return;
  }

  const input = args.join(' ');
  const existingQuest = questManager.findQuest(input);

  if (existingQuest) {
    // Resume existing quest
    if (existingQuest.success && existingQuest.data) {
      await runQuest(existingQuest.data.quest);
    } else {
      logger.error(`Failed to load quest: ${existingQuest.error || 'Unknown error'}`);
    }
  } else {
    // Create new quest
    const result = questManager.createNewQuest(input, input);
    if (!result.success || !result.data) {
      logger.error(`Failed to create quest: ${result.error || 'Unknown error'}`);
      return;
    }
    logger.success(`Created new quest: ${result.data.title}`);

    // Start with Pathseeker
    await runQuest(result.data);
  }
}

async function checkProjectDiscovery() {
  const config = configManager.loadConfig();

  if (!config.discoveryComplete) {
    logger.bright('🔍 PROJECT DISCOVERY REQUIRED 🔍\n');

    // Get user input for standards
    const standards = await getUserInput('Any specific directories with standards? (or "none"): ');

    // Find all package.json files
    const packages = fileSystem.findPackageJsons();

    if (packages.length === 0) {
      logger.error('No package.json files found!');
      process.exit(1);
    }

    logger.info(`Found ${packages.length} package(s) to analyze\n`);

    // Sequential Voidpoker spawning
    const agentSpawner = new AgentSpawner();

    for (const pkg of packages) {
      logger.info(`Analyzing: ${pkg.dir}`);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const packageName = path.basename(pkg.dir);
      const reportPath = `questmaestro/discovery/voidpoker-${timestamp}-${packageName}-report.json`;

      await agentSpawner.spawnAndWait('voidpoker', {
        workingDirectory: pkg.dir,
        questFolder: 'discovery',
        reportNumber: timestamp,
        additionalContext: {
          discoveryType: 'Project Analysis',
          packageLocation: pkg.dir,
          userStandards: standards,
          reportPath: reportPath,
        },
      });
    }

    // Update config
    config.discoveryComplete = true;
    configManager.saveConfig(config);

    logger.success('\n✅ Project discovery complete!\n');
  }
}

async function runQuest(quest: Quest) {
  logger.bright(`\n⚔️ Quest: ${quest.title}\n`);

  // Check if quest is blocked
  if (quest.status === 'blocked') {
    logger.yellow(`Quest is blocked`);
    const resume = await getUserInput('Resume quest? (y/n): ');
    if (resume.toLowerCase() !== 'y') {
      return;
    }
    quest.status = 'in_progress';
    questManager.saveQuest(quest);
  }

  // Sequential phase execution
  const agentSpawner = new AgentSpawner();

  while (!questManager.isQuestComplete(quest)) {
    const phase = questManager.getCurrentPhase(quest);

    logger.info(`Current phase: ${phase}`);

    switch (phase) {
      case 'discovery':
        await runPathseeker(quest, agentSpawner);
        break;

      case 'implementation':
        await runCodeweavers(quest, agentSpawner);
        break;

      case 'testing':
        await runSiegemaster(quest, agentSpawner);
        break;

      case 'review':
        await runLawbringer(quest, agentSpawner);
        break;

      default:
        if (phase === null) {
          // All phases complete
          completeQuest(quest);
          return;
        }
        logger.error(`Unknown phase: ${String(phase)}`);
        return;
    }

    // Reload quest to get latest state
    const reloadedQuest = questManager.getQuest(quest.folder);
    if (!reloadedQuest) {
      logger.error('Failed to reload quest');
      return;
    }
    quest = reloadedQuest;
  }

  completeQuest(quest);
}

async function runPathseeker(quest: Quest, agentSpawner: AgentSpawner) {
  logger.info('[🎯] Running Pathseeker for discovery...');

  const result = await agentSpawner.spawnAndWait('pathseeker', {
    questFolder: quest.folder,
    reportNumber: questManager.getNextReportNumber(quest.folder),
    workingDirectory: process.cwd(),
    userRequest: quest.userRequest,
    mode: quest.tasks.length > 0 ? 'validation' : 'creation',
    additionalContext: {
      existingTasks: quest.tasks,
    },
  });

  // Update quest with tasks from Pathseeker
  if (result.agentType === 'pathseeker' && result.report) {
    const report = result.report;
    if (isObject(report) && 'tasks' in report && Array.isArray(report.tasks)) {
      questManager.addTasks(quest.folder, report.tasks);
    }
  }

  logger.success('[🎁] Pathseeker complete!');
}

async function runCodeweavers(quest: Quest, agentSpawner: AgentSpawner) {
  const implementationTasks = quest.tasks.filter(
    (t) => t.type === 'implementation' && t.status !== 'complete',
  );

  if (implementationTasks.length === 0) {
    logger.info('No implementation tasks to run');
    return;
  }

  logger.info(`[🎯] Running Codeweaver for ${implementationTasks.length} tasks...`);

  for (const task of implementationTasks) {
    logger.info(`Working on: ${task.name}`);

    await agentSpawner.spawnAndWait('codeweaver', {
      questFolder: quest.folder,
      reportNumber: questManager.getNextReportNumber(quest.folder),
      workingDirectory: process.cwd(),
      additionalContext: {
        questTitle: quest.title,
        task: task,
      },
    });

    // Update task status
    task.status = 'complete';
    task.completedBy = `${questManager.getNextReportNumber(quest.folder)}-codeweaver-report.json`;
    questManager.saveQuest(quest);

    // Run ward validation
    const wardOk = runWardAll();
    if (!wardOk) {
      await handleWardFailure(quest, 'Ward validation failed', agentSpawner);
    }
  }

  logger.success('[🎁] All Codeweaver tasks complete!');
}

async function runSiegemaster(quest: Quest, agentSpawner: AgentSpawner) {
  logger.info('[🎯] Running Siegemaster for test gap analysis...');

  await agentSpawner.spawnAndWait('siegemaster', {
    questFolder: quest.folder,
    reportNumber: questManager.getNextReportNumber(quest.folder),
    workingDirectory: process.cwd(),
    additionalContext: {
      questTitle: quest.title,
      filesCreated: questManager.getCreatedFiles(quest.folder),
      testFramework: detectTestFramework(),
    },
  });

  quest.phases.testing.status = 'complete';
  quest.phases.testing.report = `${questManager.getNextReportNumber(quest.folder)}-siegemaster-report.json`;
  questManager.saveQuest(quest);

  logger.success('[🎁] Siegemaster complete!');
}

async function runLawbringer(quest: Quest, agentSpawner: AgentSpawner) {
  logger.info('[🎯] Running Lawbringer for code review...');

  await agentSpawner.spawnAndWait('lawbringer', {
    questFolder: quest.folder,
    reportNumber: questManager.getNextReportNumber(quest.folder),
    workingDirectory: process.cwd(),
    additionalContext: {
      questTitle: quest.title,
      changedFiles: questManager.getChangedFiles(quest.folder),
      wardCommands: getWardCommands(),
    },
  });

  quest.phases.review.status = 'complete';
  quest.phases.review.report = `${questManager.getNextReportNumber(quest.folder)}-lawbringer-report.json`;
  questManager.saveQuest(quest);

  logger.success('[🎁] Lawbringer complete!');
}

function completeQuest(quest: Quest) {
  logger.bright(`\n✨ Quest Complete: ${quest.title} ✨\n`);

  // Move quest to completed
  questManager.completeQuest(quest.folder);

  logger.info('Quest has been moved to completed folder.');
  logger.info(`Retrospective saved to: questmaestro/retros/`);
}

function runWardAll(): boolean {
  logger.info('[🎲] 🛡️ Running ward validation...');

  try {
    execSync('npm run ward:all', { stdio: 'pipe' });
    return true;
  } catch (error) {
    logger.error(`Ward failed: ${isError(error) ? error.message : String(error)}`);
    return false;
  }
}

async function handleWardFailure(quest: Quest, errors: string, agentSpawner: AgentSpawner) {
  logger.error('[❌] Ward validation failed!');
  logger.info('[🔧] Spawning Spiritmender to fix errors...');

  await agentSpawner.spawnAndWait('spiritmender', {
    questFolder: quest.folder,
    reportNumber: questManager.getNextReportNumber(quest.folder),
    workingDirectory: process.cwd(),
    additionalContext: {
      errors: errors,
      attemptNumber: 1,
    },
  });

  // Re-run ward to check if fixed
  const wardCheck = runWardAll();
  if (!wardCheck) {
    logger.error('Spiritmender could not fix all errors');
    quest.status = 'blocked';
    questManager.saveQuest(quest);
    throw new Error('Quest blocked: Ward validation failed');
  }

  logger.success('[🎁] ✅ Ward validation passed after Spiritmender fixes!');
}

function detectTestFramework(): string {
  // Simple detection based on package.json
  try {
    const packageJsonContent = fs.readFileSync('package.json', 'utf8');
    const packageJson = parseJsonSafely(packageJsonContent, isPackageJson);

    if (!packageJson) {
      return 'jest'; // default if parsing fails
    }

    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    if (deps.jest) return 'jest';
    if (deps.mocha) return 'mocha';
    if (deps.vitest) return 'vitest';
    if (deps.playwright) return 'playwright';

    return 'jest'; // default
  } catch {
    return 'jest';
  }
}

function getWardCommands(): string {
  try {
    const packageJsonContent = fs.readFileSync('package.json', 'utf8');
    const packageJson = parseJsonSafely(packageJsonContent, isPackageJson);

    if (!packageJson) {
      return 'npm run lint && npm run typecheck && npm run test';
    }

    const scripts = packageJson.scripts || {};

    return (
      scripts['ward:all'] || scripts.ward || 'npm run lint && npm run typecheck && npm run test'
    );
  } catch {
    return 'npm run lint && npm run typecheck && npm run test';
  }
}

async function getUserInput(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    process.stdin.once('data', (data) => {
      resolve(data.toString().trim());
    });
  });
}

// Export for testing
export {
  detectCommand,
  showQuestList,
  abandonCurrentQuest,
  startSpecificQuest,
  cleanOldQuests,
  handleQuestOrCreate,
  checkProjectDiscovery,
  runQuest,
  runPathseeker,
  runCodeweavers,
  runSiegemaster,
  runLawbringer,
  completeQuest,
  runWardAll,
  handleWardFailure,
  detectTestFramework,
  getWardCommands,
  getUserInput,
  main,
};

// Run the CLI
if (require.main === module) {
  void main();
}
