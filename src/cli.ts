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
import { progress } from './utils/progress';

const logger = new Logger();
const MAX_SPIRITMENDER_ATTEMPTS = 3;
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
  const result = await spawnAgentWithProgress(
    agentSpawner,
    'pathseeker',
    {
      questFolder: quest.folder,
      reportNumber: questManager.getNextReportNumber(quest.folder),
      workingDirectory: process.cwd(),
      userRequest: quest.userRequest,
      mode: quest.tasks.length > 0 ? 'validation' : 'creation',
      additionalContext: {
        existingTasks: quest.tasks,
        quest: quest,
      },
    },
    'Running Pathseeker for discovery',
  );

  // Handle reconciliation if in validation mode
  if (result.agentType === 'pathseeker' && result.report && quest.tasks.length > 0) {
    const report = result.report;

    // Check for reconciliation plan
    if ('reconciliationPlan' in report && report.reconciliationPlan) {
      console.log(`\n📋 Applying task reconciliation: ${report.reconciliationPlan.mode}`);

      try {
        questManager.applyReconciliation(quest.id, report.reconciliationPlan);

        // Reload quest to get updated tasks
        const updatedQuest = questManager.loadQuest(quest.folder);
        if (updatedQuest.success && updatedQuest.data) {
          Object.assign(quest, updatedQuest.data);
          console.log('✅ Task list updated successfully\n');
        }
      } catch (error) {
        logger.error(`Failed to apply reconciliation: ${String(error)}`);
        console.log('⚠️  Failed to update task list, continuing with existing tasks\n');
      }
    } else if ('tasks' in report && Array.isArray(report.tasks)) {
      // Regular task update (creation mode)
      questManager.addTasks(quest.folder, report.tasks);
    }
  } else if (result.agentType === 'pathseeker' && result.report) {
    // Creation mode - just add tasks
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
    await spawnAgentWithProgress(
      agentSpawner,
      'codeweaver',
      {
        questFolder: quest.folder,
        reportNumber: questManager.getNextReportNumber(quest.folder),
        workingDirectory: process.cwd(),
        additionalContext: {
          questTitle: quest.title,
          task: task,
        },
      },
      `Working on: ${task.name}`,
    );

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
  await spawnAgentWithProgress(
    agentSpawner,
    'siegemaster',
    {
      questFolder: quest.folder,
      reportNumber: questManager.getNextReportNumber(quest.folder),
      workingDirectory: process.cwd(),
      additionalContext: {
        questTitle: quest.title,
        filesCreated: questManager.getCreatedFiles(quest.folder),
        testFramework: detectTestFramework(),
      },
    },
    'Running Siegemaster for test gap analysis',
  );

  quest.phases.testing.status = 'complete';
  quest.phases.testing.report = `${questManager.getNextReportNumber(quest.folder)}-siegemaster-report.json`;
  questManager.saveQuest(quest);

  logger.success('[🎁] Siegemaster complete!');
}

async function runLawbringer(quest: Quest, agentSpawner: AgentSpawner) {
  await spawnAgentWithProgress(
    agentSpawner,
    'lawbringer',
    {
      questFolder: quest.folder,
      reportNumber: questManager.getNextReportNumber(quest.folder),
      workingDirectory: process.cwd(),
      additionalContext: {
        questTitle: quest.title,
        changedFiles: questManager.getChangedFiles(quest.folder),
        wardCommands: getWardCommands(),
      },
    },
    'Running Lawbringer for code review',
  );

  quest.phases.review.status = 'complete';
  quest.phases.review.report = `${questManager.getNextReportNumber(quest.folder)}-lawbringer-report.json`;
  questManager.saveQuest(quest);

  logger.success('[🎁] Lawbringer complete!');
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

async function handleWardFailure(
  quest: Quest,
  errors: string,
  agentSpawner: AgentSpawner,
  taskId?: string,
) {
  logger.error('[❌] Ward validation failed!');

  // Initialize Spiritmender tracking if needed
  if (!quest.spiritmenderAttempts) {
    quest.spiritmenderAttempts = {};
  }
  if (!quest.spiritmenderErrors) {
    quest.spiritmenderErrors = {};
  }

  const effectiveTaskId = taskId || 'global';
  const currentAttempts = quest.spiritmenderAttempts[effectiveTaskId] || 0;

  // Check if max attempts reached
  if (currentAttempts >= MAX_SPIRITMENDER_ATTEMPTS) {
    logger.error(
      `Maximum Spiritmender attempts (${MAX_SPIRITMENDER_ATTEMPTS}) reached for task ${effectiveTaskId}`,
    );
    quest.status = 'blocked';
    questManager.saveQuest(quest);
    throw new Error(`Quest blocked: Max Spiritmender attempts reached for task ${effectiveTaskId}`);
  }

  const attemptNumber = currentAttempts + 1;
  // Save ward errors to file
  const questPath = path.join('questmaestro', 'active', quest.folder);
  saveWardErrors(questPath, errors, effectiveTaskId, attemptNumber);

  // Get previous error messages for context
  const previousErrors = quest.spiritmenderErrors[effectiveTaskId] || [];

  // Determine attempt strategy based on attempt number
  const attemptStrategy = getAttemptStrategy(attemptNumber);

  await spawnAgentWithProgress(
    agentSpawner,
    'spiritmender',
    {
      questFolder: quest.folder,
      reportNumber: questManager.getNextReportNumber(quest.folder),
      workingDirectory: process.cwd(),
      additionalContext: {
        errors: errors,
        attemptNumber: attemptNumber,
        previousErrors: previousErrors,
        attemptStrategy: attemptStrategy,
        taskId: effectiveTaskId,
      },
    },
    `Spawning Spiritmender (attempt ${attemptNumber}/${MAX_SPIRITMENDER_ATTEMPTS})`,
  );

  // Update attempt tracking
  quest.spiritmenderAttempts[effectiveTaskId] = attemptNumber;
  if (!quest.spiritmenderErrors[effectiveTaskId]) {
    quest.spiritmenderErrors[effectiveTaskId] = [];
  }
  quest.spiritmenderErrors[effectiveTaskId].push(errors);
  questManager.saveQuest(quest);

  // Re-run ward to check if fixed
  const wardCheck = runWardAll();
  if (!wardCheck) {
    logger.error(`Spiritmender attempt ${attemptNumber} could not fix all errors`);

    // If this was the last attempt, block the quest
    if (attemptNumber >= MAX_SPIRITMENDER_ATTEMPTS) {
      quest.status = 'blocked';
      questManager.saveQuest(quest);
      throw new Error(
        `Quest blocked: Spiritmender failed after ${MAX_SPIRITMENDER_ATTEMPTS} attempts`,
      );
    }

    // Otherwise, try again
    return handleWardFailure(quest, errors, agentSpawner, taskId);
  }

  // Success! Remove resolved errors from tracking
  cleanResolvedWardErrors(questPath, effectiveTaskId);
  logger.success(`[🎁] ✅ Ward validation passed after Spiritmender attempt ${attemptNumber}!`);
}

function saveWardErrors(
  questFolder: string,
  errors: string,
  taskId: string,
  attemptNumber: number,
): void {
  const errorFile = path.join(questFolder, 'ward-errors-unresolved.txt');
  const timestamp = new Date().toISOString();

  // Format error entry with metadata
  const errorEntry = `[${timestamp}] [attempt-${attemptNumber}] [task-${taskId}] ${errors}\n${'='.repeat(80)}\n`;

  try {
    // Append to existing file (create if doesn't exist)
    const result = fileSystem.appendFile(errorFile, errorEntry);
    if (!result.success) {
      logger.error(`Failed to save ward errors: ${result.error}`);
    }
  } catch (error) {
    logger.error(`Failed to save ward errors: ${String(error)}`);
  }
}

// Add method to clean resolved errors
function cleanResolvedWardErrors(questFolder: string, taskId: string): void {
  const errorFile = path.join(questFolder, 'ward-errors-unresolved.txt');

  try {
    const result = fileSystem.readFile(errorFile);
    if (!result.success || !result.data) return;

    // Filter out lines for this task
    const lines = result.data.split('\n');
    const filteredLines: string[] = [];
    let skipNext = false;

    for (const line of lines) {
      if (line.includes(`[task-${taskId}]`)) {
        skipNext = true; // Skip this line and separator
        continue;
      }
      if (skipNext && line.startsWith('='.repeat(80))) {
        skipNext = false;
        continue;
      }
      filteredLines.push(line);
    }

    fileSystem.writeFile(errorFile, filteredLines.join('\n'));
  } catch (_error) {
    // File might not exist, that's OK
  }
}

function getAttemptStrategy(attemptNumber: number): string {
  switch (attemptNumber) {
    case 1:
      return 'basic_fixes: Focus on imports, syntax errors, and basic type issues';
    case 2:
      return 'deeper_analysis: Analyze logic errors, test expectations, and component interactions';
    case 3:
      return 'last_resort: Consider refactoring approach and questioning assumptions';
    default:
      return 'basic_fixes: Focus on fundamental issues';
  }
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

async function spawnAgentWithProgress(
  agentSpawner: AgentSpawner,
  agentType: Parameters<AgentSpawner['spawnAndWait']>[0],
  context: Parameters<AgentSpawner['spawnAndWait']>[1],
  description: string,
): Promise<ReturnType<AgentSpawner['spawnAndWait']>> {
  progress.start(`${description}`);

  try {
    const report = await agentSpawner.spawnAndWait(agentType, context);

    if (report) {
      if (report.status === 'complete') {
        progress.succeed(`${agentType} completed`);
      } else if (report.status === 'blocked') {
        progress.succeed(`${agentType} blocked (user input needed)`);
      } else {
        progress.fail(
          `${agentType} failed: ${(report.report as { error?: string })?.error || 'Unknown error'}`,
        );
      }
      return report;
    } else {
      progress.fail(`${agentType} failed to generate report`);
      throw new Error('Failed to generate report');
    }
  } catch (error) {
    progress.fail(`${agentType} crashed: ${String(error)}`);
    throw error;
  }
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
