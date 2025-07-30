#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { ConfigManager } from './core/config-manager';
import { QuestManager } from './core/quest-manager';
import { FileSystem } from './core/file-system';
import { Logger } from './utils/logger';
import { AgentSpawner } from './agents/agent-spawner';
import type { Quest } from './models/quest';
import { isError, isPackageJson, parseJsonSafely } from './utils/type-guards';
import { EscapeHatchError } from './core/escape-hatch-error';
import { DiscoveryPhaseRunner } from './core/discovery-phase-runner';
import { ImplementationPhaseRunner } from './core/implementation-phase-runner';
import { TestingPhaseRunner } from './core/testing-phase-runner';
import { ReviewPhaseRunner } from './core/review-phase-runner';
import type { PhaseRunner } from './core/phase-runner-interface';

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
  help: showHelp,
  default: (args: string[]) => handleQuestOrCreate(args),
};

async function main() {
  try {
    // Check if .questmaestro config exists, create if missing
    if (!fs.existsSync('.questmaestro')) {
      logger.info('No .questmaestro config found. Initializing...');
      const initialized = configManager.initializeConfig();
      if (!initialized) {
        logger.error('Failed to initialize .questmaestro config');
        process.exit(1);
      }
      logger.success('.questmaestro config created successfully!');
    }

    // Parse command
    const args = process.argv.slice(2);

    // Handle --help flag (before discovery)
    if (args.includes('--help') || args.includes('-h') || args[0] === 'help') {
      showHelp();
      process.exit(0);
    }

    // Auto-launch Voidpoker if needed
    await checkProjectDiscovery();

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

function showHelp() {
  logger.bright('\n🗡️  QuestMaestro - AI Quest Orchestration System\n');

  logger.info('Usage: questmaestro [command] [args]\n');

  logger.info('Commands:');
  logger.info('  questmaestro <task>       Create and run a new quest');
  logger.info('  questmaestro list         List all quests');
  logger.info('  questmaestro start <id>   Start a specific quest');
  logger.info('  questmaestro abandon      Abandon the current quest');
  logger.info('  questmaestro clean        Clean up old completed/abandoned quests');
  logger.info('  questmaestro help         Show this help message\n');

  logger.info('Examples:');
  logger.info('  questmaestro "add a new user authentication feature"');
  logger.info('  questmaestro list');
  logger.info('  questmaestro start quest-001\n');
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
    process.exit(0);
  }

  const input = args.join(' ');
  const existingQuest = questManager.findQuest(input);

  if (existingQuest.success && existingQuest.data) {
    // Resume existing quest
    await runQuest(existingQuest.data.quest);
  } else {
    // Create new quest (existingQuest.success is false)
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

  // Check quest freshness before continuing
  if (!(await checkAndWarnStaleness(quest))) {
    return;
  }

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

  // Create phase runners
  const phaseRunners: Map<string, PhaseRunner> = new Map([
    ['discovery', new DiscoveryPhaseRunner(questManager, fileSystem, logger)],
    ['implementation', new ImplementationPhaseRunner(questManager, fileSystem, logger)],
    ['testing', new TestingPhaseRunner(questManager, fileSystem, logger)],
    ['review', new ReviewPhaseRunner(questManager, fileSystem, logger)],
  ]);

  while (!questManager.isQuestComplete(quest)) {
    const phase = questManager.getCurrentPhase(quest);

    logger.info(`Current phase: ${phase}`);

    if (phase === null) {
      // All phases complete
      completeQuest(quest);
      return;
    }

    const phaseRunner = phaseRunners.get(phase);
    if (!phaseRunner) {
      logger.error(`Unknown phase: ${String(phase)}`);
      return;
    }

    try {
      if (phaseRunner.canRun(quest)) {
        await phaseRunner.run(quest, agentSpawner);
      } else {
        // Skip to next phase if can't run (e.g., no tasks for this phase)
        quest.phases[phase].status = 'skipped';
        questManager.saveQuest(quest);
      }
    } catch (error) {
      if (error instanceof EscapeHatchError) {
        logger.error(`Agent triggered escape hatch: ${error.escape.reason}`);
        logger.info(`Analysis: ${error.escape.analysis}`);
        logger.info(`Recommendation: ${error.escape.recommendation}`);
        quest.status = 'blocked';
        questManager.saveQuest(quest);
        return;
      }
      throw error;
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

function completeQuest(quest: Quest) {
  logger.bright(`\n✨ Quest Complete: ${quest.title} ✨\n`);

  // Generate and save retrospective
  const retrospective = questManager.generateRetrospective(quest.folder);
  questManager.saveRetrospective(quest.folder, retrospective);

  // Move quest to completed
  questManager.completeQuest(quest.folder);

  logger.info('Quest has been moved to completed folder.');
  logger.info(`Retrospective saved to: questmaestro/retros/`);
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

async function checkAndWarnStaleness(quest: Quest): Promise<boolean> {
  const freshness = questManager.validateQuestFreshness(quest);

  if (freshness.isStale) {
    logger.warn(`⚠️  ${freshness.reason}`);
    console.log('The codebase may have changed significantly since this quest was created.');
    console.log('Continuing may lead to conflicts or errors.\n');

    const answer = await getUserInput('Continue anyway? (y/n): ');
    if (answer.toLowerCase() !== 'y') {
      console.log('\nQuest cancelled. Create a fresh quest with: questmaestro "your request"');
      return false;
    }
  }

  return true;
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
  completeQuest,
  detectTestFramework,
  getWardCommands,
  getUserInput,
  main,
};

// Run the CLI
if (require.main === module) {
  void main();
}
