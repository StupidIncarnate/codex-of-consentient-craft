import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import * as readline from 'readline';
import { Logger } from '../utils/logger';
import type { AgentReport, AgentContext, AgentType } from '../models/agent';
import type { Quest } from '../models/quest';
import { QuestManager } from '../core/quest-manager';

const MAX_RECOVERY_ATTEMPTS = 3;

export class AgentSpawner {
  private logger = new Logger();
  private agentMarkdownPath = path.join(__dirname, '..', 'commands', 'quest');
  private questManager?: QuestManager;

  constructor(questManager?: QuestManager) {
    this.questManager = questManager;
  }

  private calculateQuestAge(quest: Quest): string {
    const createdAt = new Date(quest.createdAt);
    const now = new Date();
    const ageMs = now.getTime() - createdAt.getTime();
    const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));

    if (ageDays === 0) {
      return 'Created today';
    } else if (ageDays === 1) {
      return '1 day old';
    } else {
      return `${ageDays} days old`;
    }
  }

  async spawnAndWait(agentType: AgentType, context: AgentContext): Promise<AgentReport> {
    // Generate report filename
    const reportFilename = `${context.reportNumber.toString().padStart(3, '0')}-${agentType}-report.json`;
    const reportPath = this.getReportPath(agentType, context, reportFilename);

    // Read agent markdown
    const agentMd = this.readAgentFile(agentType);

    // Replace $ARGUMENTS with context
    const prompt = agentMd.replace('$ARGUMENTS', this.formatContext(agentType, context));

    this.logger.info(`[🎲] Spawning ${agentType}...`);

    // Use claude from this package's node_modules (for npx usage)
    const claudePath = path.join(__dirname, '../../../node_modules', '.bin', 'claude');

    // Spawn Claude in interactive mode - pass prompt directly like in spike
    const claudeProcess = spawn(claudePath, [prompt], {
      stdio: 'inherit',
      env: { ...process.env },
    });

    // Monitor for report file
    return new Promise((resolve, reject) => {
      const checkInterval = 500; // ms
      let checkCount = 0;
      const maxChecks = 7200; // 60 minutes max
      let watcher: NodeJS.Timeout;

      // Centralized cleanup function
      const cleanup = (shouldExit: boolean = false) => {
        if (watcher) clearInterval(watcher);
        claudeProcess.kill('SIGTERM');
        process.removeListener('SIGINT', handleSigInt);
        process.removeListener('SIGTERM', handleSigTerm);
        if (shouldExit) process.exit(0);
      };

      // Signal handlers
      const handleSigInt = () => cleanup(true);
      const handleSigTerm = () => cleanup(true);

      process.on('SIGINT', handleSigInt);
      process.on('SIGTERM', handleSigTerm);

      watcher = setInterval(() => {
        checkCount++;

        // Check if report file exists
        if (fs.existsSync(reportPath)) {
          cleanup();

          // Parse JSON report
          try {
            const reportContent = fs.readFileSync(reportPath, 'utf8');
            const report = JSON.parse(reportContent) as AgentReport;

            this.logger.success(`[🎁] ${agentType} complete!`);

            // Cleanup already done above

            if (report.status === 'blocked') {
              // Handle blocked agent
              this.handleBlockedAgent(agentType, context, report.blockReason || 'Unknown reason')
                .then(resolve)
                .catch(reject);
            } else {
              resolve(report);
            }
          } catch (_error) {
            // Cleanup already done above
            reject(
              new Error(
                `Failed to parse report from ${agentType}: ${_error instanceof Error ? _error.message : String(_error)}`,
              ),
            );
          }
        }

        // Check for timeout
        if (checkCount > maxChecks) {
          cleanup();
          reject(new Error(`${agentType} timed out after 60 minutes`));
        }
      }, checkInterval);

      // Handle unexpected exit
      claudeProcess.on('exit', (_code) => {
        cleanup();

        // Check if report was generated
        if (!fs.existsSync(reportPath)) {
          this.logger.warn(`⚠️ ${agentType} exited without report`);

          // Handle recovery
          this.handleAgentRecovery(agentType, context).then(resolve).catch(reject);
        }
      });

      // Handle process errors
      claudeProcess.on('error', (error) => {
        cleanup();
        reject(new Error(`Failed to spawn ${agentType}: ${error.message}`));
      });
    });
  }

  private getReportPath(
    agentType: AgentType,
    context: AgentContext,
    reportFilename: string,
  ): string {
    if (agentType === 'voidpoker') {
      // Voidpoker writes to discovery folder
      return (context.additionalContext as { reportPath: string }).reportPath;
    }
    return path.join('questmaestro', 'active', context.questFolder, reportFilename);
  }

  private readAgentFile(agentType: string): string {
    const agentPath = path.join(this.agentMarkdownPath, `${agentType}.md`);

    if (!fs.existsSync(agentPath)) {
      throw new Error(`Agent markdown not found: ${agentPath}`);
    }

    return fs.readFileSync(agentPath, 'utf8');
  }

  private formatContext(agentType: AgentType, context: AgentContext): string {
    switch (agentType) {
      case 'pathseeker':
        return this.formatPathseekerContext(context);
      case 'codeweaver':
        return this.formatCodeweaverContext(context);
      case 'siegemaster':
        return this.formatSiegemasterContext(context);
      case 'lawbringer':
        return this.formatLawbringerContext(context);
      case 'spiritmender':
        return this.formatSpiritmenderContext(context);
      case 'voidpoker':
        return this.formatVoidpokerContext(context);
      default:
        // This should never happen as TypeScript enforces all AgentType values are handled
        const _exhaustiveCheck: never = agentType;
        return _exhaustiveCheck;
    }
  }

  private formatPathseekerContext(context: AgentContext): string {
    const parts = [
      `User request: ${context.userRequest}`,
      `Working directory: ${process.cwd()}`,
      `Quest folder: ${context.questFolder}`,
      `Report number: ${context.reportNumber}`,
      `Quest mode: ${context.mode || 'creation'}`,
    ];

    // Add continuation mode information
    if (context.continuationMode) {
      parts.push('\n[CONTINUATION MODE]');
      parts.push(`Previous report number: ${context.previousReportNumber || 'unknown'}`);
      if (context.userGuidance) {
        parts.push(`User guidance: ${context.userGuidance}`);
      }
    }

    if (context.mode === 'validation' && context.additionalContext) {
      const additionalCtx = context.additionalContext as {
        existingTasks?: unknown;
        quest?: Quest;
      };
      if (additionalCtx.existingTasks) {
        parts.push('\nExisting tasks:');
        parts.push(JSON.stringify(additionalCtx.existingTasks, null, 2));
      }
      if (additionalCtx.quest) {
        const quest = additionalCtx.quest;
        const questAge = this.calculateQuestAge(quest);
        parts.push(`\nQuest age: ${questAge}`);
        parts.push('\nCurrent task state:');
        const taskSummary = quest.tasks.map((t) => ({
          id: t.id,
          title: t.name,
          description: t.description,
          status: t.status,
          dependencies: t.dependencies,
          type: t.type,
        }));
        parts.push(JSON.stringify(taskSummary, null, 2));
        parts.push(
          '\nInstructions: Analyze the current task list and codebase. Return a reconciliation plan if tasks need updating.',
        );
      }
    } else if (context.mode === 'recovery_assessment' && context.additionalContext) {
      const additionalCtx = context.additionalContext as {
        crashedAgent?: string;
        originalTask?: unknown;
        crashReportNumber?: string;
      };
      parts.push('\n[RECOVERY ASSESSMENT MODE]');
      parts.push(`Crashed agent: ${additionalCtx.crashedAgent || 'unknown'}`);
      parts.push(`Crash report number: ${additionalCtx.crashReportNumber || 'unknown'}`);
      parts.push('\nOriginal task:');
      parts.push(JSON.stringify(additionalCtx.originalTask || {}, null, 2));
      parts.push('\nPlease analyze the current codebase state vs the original task.');
      parts.push('Determine which files were completed, partially modified, or still missing.');
      parts.push('Provide a recommendation: continue, restart, or manual_intervention.');
    }

    return parts.join('\n');
  }

  private formatCodeweaverContext(context: AgentContext): string {
    const additionalCtx =
      (context.additionalContext as {
        questTitle?: string;
        task?: unknown;
        instruction?: string;
      }) || {};
    const parts = [
      `Quest: ${additionalCtx.questTitle || 'Unknown'}`,
      `Quest folder: ${context.questFolder}`,
      `Report number: ${context.reportNumber}`,
    ];

    // Add continuation/recovery mode information
    if (context.continuationMode) {
      parts.push('\n[CONTINUATION MODE]');
      parts.push(`Previous report number: ${context.previousReportNumber || 'unknown'}`);
      if (context.userGuidance) {
        parts.push(`User guidance: ${context.userGuidance}`);
      }
    } else if (context.recoveryMode) {
      parts.push('\n[RECOVERY MODE]');
      if (context.previousReportNumbers?.length) {
        parts.push(`Previous report numbers: ${context.previousReportNumbers.join(', ')}`);
      }
      if (additionalCtx.instruction) {
        parts.push(`Instruction: ${additionalCtx.instruction}`);
      }
    }

    parts.push(`Task: ${JSON.stringify(additionalCtx.task || {}, null, 2)}`);
    parts.push(`Ward commands: npm run ward:all`);

    return parts.join('\n');
  }

  private formatSiegemasterContext(context: AgentContext): string {
    const additionalCtx =
      (context.additionalContext as {
        questTitle?: string;
        filesCreated?: string[];
        testFramework?: string;
        observableActions?: unknown;
      }) || {};
    const parts = [
      `Quest: ${additionalCtx.questTitle || 'Unknown'}`,
      `Quest folder: ${context.questFolder}`,
      `Report number: ${context.reportNumber}`,
      `Files created: ${JSON.stringify(additionalCtx.filesCreated || [], null, 2)}`,
      `Test framework: ${additionalCtx.testFramework || 'unknown'}`,
    ];

    if (additionalCtx.observableActions) {
      parts.push(`Observable actions: ${JSON.stringify(additionalCtx.observableActions, null, 2)}`);
    }

    return parts.join('\n');
  }

  private formatLawbringerContext(context: AgentContext): string {
    const additionalCtx =
      (context.additionalContext as { questTitle?: string; changedFiles?: string[] }) || {};
    return [
      `Quest: ${additionalCtx.questTitle || 'Unknown'}`,
      `Quest folder: ${context.questFolder}`,
      `Report number: ${context.reportNumber}`,
      `Changed files: ${JSON.stringify(additionalCtx.changedFiles || [], null, 2)}`,
      `Ward commands: ${JSON.stringify(context.wardCommands || {})}`,
      `Standards: Check CLAUDE.md files in directory hierarchy`,
    ].join('\n');
  }

  private formatSpiritmenderContext(context: AgentContext): string {
    const additionalCtx =
      (context.additionalContext as {
        questTitle?: string;
        errors?: string;
        attemptNumber?: number;
      }) || {};
    return [
      `Quest: ${additionalCtx.questTitle || 'Direct invocation'}`,
      `Quest folder: ${context.questFolder}`,
      `Report number: ${context.reportNumber}`,
      `Ward errors:\n${additionalCtx.errors || 'None'}`,
      `Attempt number: ${additionalCtx.attemptNumber || 1}`,
    ].join('\n');
  }

  private formatVoidpokerContext(context: AgentContext): string {
    const additionalCtx =
      (context.additionalContext as {
        discoveryType?: string;
        packageLocation?: string;
        userStandards?: string;
        reportPath?: string;
      }) || {};
    return [
      `Discovery type: ${additionalCtx.discoveryType || 'unknown'}`,
      `Package location: ${additionalCtx.packageLocation || 'unknown'}`,
      `User standards: ${additionalCtx.userStandards || 'none'}`,
      `Report path: ${additionalCtx.reportPath || 'unknown'}`,
    ].join('\n');
  }

  private async handleBlockedAgent(
    agentType: AgentType,
    originalContext: AgentContext,
    blockReason: string,
  ): Promise<AgentReport> {
    this.logger.warn(`\n⚠️  ${agentType} is blocked: ${blockReason}\n`);

    // Get user input
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const userGuidance = await new Promise<string>((resolve) => {
      rl.question('Please provide guidance to unblock the agent: ', (answer) => {
        rl.close();
        resolve(answer);
      });
    });

    // Re-spawn agent with continuation context
    const continuationContext: AgentContext = {
      ...originalContext,
      continuationMode: true,
      previousReportNumber: originalContext.reportNumber,
      reportNumber: (parseInt(originalContext.reportNumber) + 1).toString(),
      userGuidance,
      additionalContext: {
        ...((originalContext.additionalContext as object) || {}),
        blockReason,
        userGuidance,
      },
    };

    this.logger.info(`Continuing ${agentType} with user guidance...`);
    return this.spawnAndWait(agentType, continuationContext);
  }

  private async handleAgentRecovery(
    agentType: AgentType,
    originalContext: AgentContext,
  ): Promise<AgentReport> {
    this.logger.info(`Attempting recovery for ${agentType}...`);

    // Check recovery attempts limit
    if (this.questManager) {
      const taskId = (originalContext.additionalContext as { task?: { id?: string } })?.task?.id;
      if (taskId && !this.canRecover(originalContext.questFolder, agentType, taskId)) {
        throw new Error(
          `Maximum recovery attempts (${MAX_RECOVERY_ATTEMPTS}) reached for ${agentType} on task ${taskId}`,
        );
      }
    }

    // For all agents except voidpoker, spawn Pathseeker for recovery assessment
    if (agentType !== 'voidpoker') {
      // First spawn Pathseeker to assess current state
      const assessmentContext: AgentContext = {
        ...originalContext,
        mode: 'recovery_assessment',
        reportNumber: (parseInt(originalContext.reportNumber) + 1).toString(),
        additionalContext: {
          crashedAgent: agentType,
          originalTask: (originalContext.additionalContext as { task?: unknown })?.task,
          originalContext: originalContext.additionalContext,
          crashReportNumber: originalContext.reportNumber,
        },
      };

      try {
        const assessmentReport = await this.spawnAndWait('pathseeker', assessmentContext);

        if (
          assessmentReport.agentType === 'pathseeker' &&
          'recoveryAssessment' in assessmentReport.report
        ) {
          const assessment = assessmentReport.report.recoveryAssessment;

          if (assessment?.recommendation === 'continue') {
            // Continue from where we left off
            const recoveryContext: AgentContext = {
              ...originalContext,
              reportNumber: (parseInt(assessmentContext.reportNumber) + 1).toString(),
              recoveryMode: true,
              previousReportNumbers: [originalContext.reportNumber, assessmentContext.reportNumber],
              additionalContext: {
                ...((originalContext.additionalContext as object) || {}),
                recoveryAssessment: assessment,
                instruction: 'Continue the task from where the previous agent left off.',
              },
            };

            return this.spawnAndWait(agentType, recoveryContext);
          } else if (assessment?.recommendation === 'restart') {
            // Restart the task from the beginning
            const recoveryContext: AgentContext = {
              ...originalContext,
              reportNumber: (parseInt(assessmentContext.reportNumber) + 1).toString(),
              recoveryMode: true,
              previousReportNumbers: [originalContext.reportNumber, assessmentContext.reportNumber],
              additionalContext: {
                ...((originalContext.additionalContext as object) || {}),
                recoveryAssessment: assessment,
                instruction: 'Restart the task from the beginning.',
              },
            };

            return this.spawnAndWait(agentType, recoveryContext);
          } else {
            // Manual intervention required
            throw new Error(
              `Recovery assessment requires manual intervention: ${assessment?.reason}`,
            );
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`Recovery assessment failed: ${errorMessage}`);

        // Track recovery attempt
        const taskId = (originalContext.additionalContext as { task?: { id?: string } })?.task?.id;
        if (taskId) {
          this.trackRecoveryAttempt(
            originalContext.questFolder,
            agentType,
            taskId,
            errorMessage,
            originalContext.reportNumber,
          );
        }
      }

      // Fallback to simple retry if assessment fails
      const recoveryContext: AgentContext = {
        ...originalContext,
        reportNumber: (parseInt(originalContext.reportNumber) + 1).toString(),
        recoveryMode: true,
        additionalContext: {
          ...((originalContext.additionalContext as object) || {}),
          instruction: 'The previous agent exited unexpectedly. Continue the task.',
        },
      };

      return this.spawnAndWait(agentType, recoveryContext);
    } else {
      // For voidpoker, just respawn without assessment
      const recoveryContext: AgentContext = {
        ...originalContext,
        reportNumber: (parseInt(originalContext.reportNumber) + 1).toString(),
        recoveryMode: true,
      };

      return this.spawnAndWait(agentType, recoveryContext);
    }
  }

  private canRecover(questFolder: string, agentType: AgentType, taskId: string): boolean {
    if (!this.questManager) return true; // No tracking, allow recovery

    const quest = this.getQuest(questFolder);
    if (!quest) return true; // No quest, allow recovery

    // Type-safe access to recovery attempts
    if (!quest.agentRecoveryAttempts) {
      return true; // No recovery attempts tracked yet
    }

    const recoveryAttempts = quest.agentRecoveryAttempts as Record<string, Record<string, number>>;
    const agentAttempts = recoveryAttempts[agentType];
    if (!agentAttempts) {
      return true; // No attempts for this agent type
    }

    const attempts = agentAttempts[taskId] || 0;
    return attempts < MAX_RECOVERY_ATTEMPTS;
  }

  private trackRecoveryAttempt(
    questFolder: string,
    agentType: AgentType,
    taskId: string,
    failureReason: string,
    reportNumber: string,
  ): void {
    if (!this.questManager) return;

    const quest = this.getQuest(questFolder);
    if (!quest) return;

    // Initialize recovery tracking structures
    if (!quest.agentRecoveryAttempts) {
      quest.agentRecoveryAttempts = {};
    }

    const recoveryAttempts = quest.agentRecoveryAttempts as Record<string, Record<string, number>>;

    // Type-safe initialization of agent attempts
    if (!recoveryAttempts[agentType]) {
      recoveryAttempts[agentType] = {};
    }

    // Get the agent's attempt tracker
    const agentAttempts = recoveryAttempts[agentType];

    // Increment attempt count
    const currentAttempts = agentAttempts[taskId] || 0;
    agentAttempts[taskId] = currentAttempts + 1;

    // Add to recovery history
    if (!quest.recoveryHistory) {
      quest.recoveryHistory = [];
    }

    const history = quest.recoveryHistory as Array<{
      timestamp: string;
      agentType: string;
      taskId?: string;
      attemptNumber: number;
      failureReason: string;
      previousReportNumber: string;
    }>;

    history.push({
      timestamp: new Date().toISOString(),
      agentType,
      taskId,
      attemptNumber: currentAttempts + 1,
      failureReason,
      previousReportNumber: reportNumber,
    });

    // Save quest
    this.questManager.saveQuest(quest);
  }

  private getQuest(questFolder: string): Quest | null {
    if (!this.questManager) return null;

    const result = this.questManager.loadQuest(questFolder);
    return result.success && result.data ? result.data : null;
  }
}
