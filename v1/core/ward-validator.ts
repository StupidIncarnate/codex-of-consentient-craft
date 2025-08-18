import { execSync } from 'child_process';
import * as path from 'path';
import type { Quest } from '../models/quest';
import type { AgentSpawner } from '../agents/agent-spawner';
import type { FileSystem } from './file-system';
import type { Logger } from '../utils/logger';
import type { QuestManager } from './quest-manager';
import { isError } from '../utils/type-guards';

const MAX_SPIRITMENDER_ATTEMPTS = 3;

export interface WardValidationResult {
  success: boolean;
  errors?: string;
}

export class WardValidator {
  constructor(
    private fileSystem: FileSystem,
    private logger: Logger,
    private execCommand: typeof execSync = execSync,
  ) {}

  validate(): WardValidationResult {
    this.logger.info('[🎲] 🛡️ Running ward validation...');

    try {
      this.execCommand('npm run ward:all', { stdio: 'pipe' });
      return { success: true };
    } catch (error: unknown) {
      let errorMessage: string;

      if (error && typeof error === 'object' && 'stderr' in error) {
        const stderr = error.stderr;
        if (Buffer.isBuffer(stderr)) {
          errorMessage = stderr.toString();
        } else if (typeof stderr === 'string') {
          errorMessage = stderr;
        } else {
          errorMessage = 'Command failed with stderr output';
        }
      } else if (isError(error)) {
        errorMessage = error.message;
      } else {
        errorMessage = String(error);
      }

      this.logger.error(`Ward failed: ${errorMessage}`);
      return { success: false, errors: errorMessage };
    }
  }

  async handleFailure(
    quest: Quest,
    errors: string,
    agentSpawner: AgentSpawner,
    questManager: QuestManager,
    taskId?: string,
  ): Promise<void> {
    this.logger.error('[❌] Ward validation failed!');

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
      this.logger.error(
        `Maximum Spiritmender attempts (${MAX_SPIRITMENDER_ATTEMPTS}) reached for task ${effectiveTaskId}`,
      );
      quest.status = 'blocked';
      questManager.saveQuest(quest);
      throw new Error(
        `Quest blocked: Max Spiritmender attempts reached for task ${effectiveTaskId}`,
      );
    }

    const attemptNumber = currentAttempts + 1;
    // Save ward errors to file
    const questPath = path.join('questmaestro', 'active', quest.folder);
    this.saveWardErrors(questPath, errors, effectiveTaskId, attemptNumber);

    // Get previous error messages for context (copy array to avoid mutation)
    const previousErrors = [...(quest.spiritmenderErrors[effectiveTaskId] || [])];

    // Determine attempt strategy based on attempt number
    const attemptStrategy = this.getAttemptStrategy(attemptNumber);

    await this.spawnAgentWithProgress(
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
    const wardCheck = this.validate();
    if (!wardCheck.success) {
      this.logger.error(`Spiritmender attempt ${attemptNumber} could not fix all errors`);

      // If this was the last attempt, block the quest
      if (attemptNumber >= MAX_SPIRITMENDER_ATTEMPTS) {
        quest.status = 'blocked';
        questManager.saveQuest(quest);
        throw new Error(
          `Quest blocked: Spiritmender failed after ${MAX_SPIRITMENDER_ATTEMPTS} attempts`,
        );
      }

      // Otherwise, try again
      return this.handleFailure(quest, wardCheck.errors || '', agentSpawner, questManager, taskId);
    }

    // Success! Remove resolved errors from tracking
    this.cleanResolvedWardErrors(questPath, effectiveTaskId);
    this.logger.success(
      `[🎁] ✅ Ward validation passed after Spiritmender attempt ${attemptNumber}!`,
    );
  }

  private saveWardErrors(
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
      const result = this.fileSystem.appendFile(errorFile, errorEntry);
      if (!result.success) {
        this.logger.error(`Failed to save ward errors: ${result.error}`);
      }
    } catch (error) {
      this.logger.error(`Failed to save ward errors: ${String(error)}`);
    }
  }

  private cleanResolvedWardErrors(questFolder: string, taskId: string): void {
    const errorFile = path.join(questFolder, 'ward-errors-unresolved.txt');

    try {
      const result = this.fileSystem.readFile(errorFile);
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

      this.fileSystem.writeFile(errorFile, filteredLines.join('\n'));
    } catch (_error) {
      // File might not exist, that's OK
    }
  }

  private getAttemptStrategy(attemptNumber: number): string {
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

  private async spawnAgentWithProgress(
    agentSpawner: AgentSpawner,
    agentType: Parameters<AgentSpawner['spawnAndWait']>[0],
    context: Parameters<AgentSpawner['spawnAndWait']>[1],
    description: string,
  ): Promise<ReturnType<AgentSpawner['spawnAndWait']>> {
    // Show the description without spinner since agent will output to terminal
    this.logger.info(`[🎲] ${description}`);
    try {
      const report = await agentSpawner.spawnAndWait(agentType, context);
      return report;
    } catch (error) {
      this.logger.error(`Agent spawn failed: ${isError(error) ? error.message : String(error)}`);
      throw error;
    }
  }
}
