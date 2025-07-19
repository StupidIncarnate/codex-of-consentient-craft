import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { Logger } from '../utils/logger';
import type { AgentReport, AgentContext } from '../models/agent';

export class AgentSpawner {
  private logger = new Logger();
  private agentMarkdownPath = path.join(__dirname, '..', 'commands', 'quest');

  async spawnAndWait(agentType: string, context: AgentContext): Promise<AgentReport> {
    // Generate report filename
    const reportFilename = `${context.reportNumber.toString().padStart(3, '0')}-${agentType}-report.json`;
    const reportPath = this.getReportPath(agentType, context, reportFilename);

    // Read agent markdown
    const agentMd = this.readAgentFile(agentType);

    // Replace $ARGUMENTS with context
    const prompt = agentMd.replace('$ARGUMENTS', this.formatContext(agentType, context));

    // Write prompt to temporary file (Claude reads from file)
    const tempPromptFile = path.join('/tmp', `questmaestro-${agentType}-${Date.now()}.md`);
    fs.writeFileSync(tempPromptFile, prompt);

    this.logger.info(`[🎲] Spawning ${agentType}...`);

    // Spawn Claude in interactive mode
    const claudeProcess = spawn('claude', ['-m', tempPromptFile], {
      stdio: 'inherit',
      env: { ...process.env },
    });

    // Monitor for report file
    return new Promise((resolve, reject) => {
      const checkInterval = 500; // ms
      let checkCount = 0;
      const maxChecks = 7200; // 60 minutes max

      const watcher = setInterval(() => {
        checkCount++;

        // Check if report file exists
        if (fs.existsSync(reportPath)) {
          clearInterval(watcher);
          claudeProcess.kill();

          // Clean up temp file
          try {
            fs.unlinkSync(tempPromptFile);
          } catch {}

          // Parse JSON report
          try {
            const reportContent = fs.readFileSync(reportPath, 'utf8');
            const report = JSON.parse(reportContent) as AgentReport;

            this.logger.success(`[🎁] ${agentType} complete!`);

            if (report.status === 'blocked') {
              // Handle blocked agent
              void this.handleBlockedAgent(
                agentType,
                context,
                report.blockReason || 'Unknown reason',
              );
            } else {
              resolve(report);
            }
          } catch (error) {
            reject(
              new Error(
                `Failed to parse report from ${agentType}: ${error instanceof Error ? error.message : String(error)}`,
              ),
            );
          }
        }

        // Check for timeout
        if (checkCount > maxChecks) {
          clearInterval(watcher);
          claudeProcess.kill();
          reject(new Error(`${agentType} timed out after 60 minutes`));
        }
      }, checkInterval);

      // Handle unexpected exit
      claudeProcess.on('exit', (_code) => {
        clearInterval(watcher);

        // Clean up temp file
        try {
          fs.unlinkSync(tempPromptFile);
        } catch {}

        // Check if report was generated
        if (!fs.existsSync(reportPath)) {
          this.logger.warn(`⚠️ ${agentType} exited without report`);

          // Handle recovery
          this.handleAgentRecovery(agentType, context).then(resolve).catch(reject);
        }
      });

      // Handle process errors
      claudeProcess.on('error', (error) => {
        clearInterval(watcher);
        try {
          fs.unlinkSync(tempPromptFile);
        } catch {}
        reject(new Error(`Failed to spawn ${agentType}: ${error.message}`));
      });
    });
  }

  private getReportPath(agentType: string, context: AgentContext, reportFilename: string): string {
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

  private formatContext(agentType: string, context: AgentContext): string {
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
        throw new Error(`Unknown agent type: ${agentType}`);
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

    if (context.mode === 'validation' && context.additionalContext) {
      const additionalCtx = context.additionalContext as { existingTasks?: unknown };
      if (additionalCtx.existingTasks) {
        parts.push('\nExisting tasks:');
        parts.push(JSON.stringify(additionalCtx.existingTasks, null, 2));
      }
    }

    return parts.join('\n');
  }

  private formatCodeweaverContext(context: AgentContext): string {
    const additionalCtx =
      (context.additionalContext as { questTitle?: string; task?: unknown }) || {};
    return [
      `Quest: ${additionalCtx.questTitle || 'Unknown'}`,
      `Quest folder: ${context.questFolder}`,
      `Report number: ${context.reportNumber}`,
      `Task: ${JSON.stringify(additionalCtx.task || {}, null, 2)}`,
      `Ward commands: npm run ward:all`,
    ].join('\n');
  }

  private formatSiegemasterContext(context: AgentContext): string {
    const additionalCtx =
      (context.additionalContext as {
        questTitle?: string;
        filesCreated?: string[];
        testFramework?: string;
      }) || {};
    return [
      `Quest: ${additionalCtx.questTitle || 'Unknown'}`,
      `Quest folder: ${context.questFolder}`,
      `Report number: ${context.reportNumber}`,
      `Files created: ${JSON.stringify(additionalCtx.filesCreated || [], null, 2)}`,
      `Test framework: ${additionalCtx.testFramework || 'unknown'}`,
    ].join('\n');
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

  private handleBlockedAgent(
    agentType: string,
    _originalContext: AgentContext,
    blockReason: string,
  ) {
    this.logger.warn(`Agent blocked: ${blockReason}`);

    // In a real implementation, we'd get user input here
    // For now, just throw an error
    throw new Error(`${agentType} is blocked: ${blockReason}`);
  }

  private async handleAgentRecovery(
    agentType: string,
    originalContext: AgentContext,
  ): Promise<AgentReport> {
    this.logger.info(`Attempting recovery for ${agentType}...`);

    // For implementation agents, check what files were created/modified
    if (agentType === 'codeweaver') {
      // Could spawn Pathseeker to assess current state
      // For now, just retry
      const recoveryContext = {
        ...originalContext,
        reportNumber: originalContext.reportNumber + 1,
        recoveryMode: true,
        instruction: 'The previous agent exited unexpectedly. Continue the task.',
      };

      return this.spawnAndWait(agentType, recoveryContext);
    } else {
      // For non-implementation agents, just respawn
      const recoveryContext = {
        ...originalContext,
        reportNumber: originalContext.reportNumber + 1,
        recoveryMode: true,
      };

      return this.spawnAndWait(agentType, recoveryContext);
    }
  }
}
