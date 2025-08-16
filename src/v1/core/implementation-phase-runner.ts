import type { Quest, PhaseType } from '../models/quest';
import type { AgentReport, AgentType } from '../models/agent';
import type { AgentSpawner } from '../agents/agent-spawner';
import type { WardValidator } from './ward-validator';
import type { QuestManager } from './quest-manager';
import type { FileSystem } from './file-system';
import type { Logger } from '../utils/logger';
import { BasePhaseRunner } from './base-phase-runner';
import { EscapeHatchError } from './escape-hatch-error';

export class ImplementationPhaseRunner extends BasePhaseRunner {
  constructor(
    protected questManager: QuestManager,
    protected fileSystem: FileSystem,
    protected logger: Logger,
    private wardValidator?: WardValidator,
  ) {
    super(questManager, fileSystem, logger);
  }

  getAgentType(): AgentType {
    return 'codeweaver';
  }

  getPhaseType(): PhaseType {
    return 'implementation';
  }

  canRun(quest: Quest): boolean {
    const hasImplementationTasks = quest.tasks.some(
      (t) => t.type === 'implementation' && t.status !== 'complete',
    );
    return super.canRun(quest) && hasImplementationTasks;
  }

  async run(quest: Quest, agentSpawner: AgentSpawner): Promise<void> {
    // Reload quest to get fresh task list
    let currentQuest = this.questManager.getQuest(quest.folder);
    if (!currentQuest) {
      throw new Error(`Failed to reload quest: ${quest.folder}`);
    }

    const implementationTasks = currentQuest.tasks.filter(
      (t) => t.type === 'implementation' && t.status !== 'complete',
    );

    if (implementationTasks.length === 0) {
      return;
    }

    // Mark phase as in_progress
    currentQuest.phases[this.getPhaseType()].status = 'in_progress';
    this.questManager.saveQuest(currentQuest);

    // Process each task sequentially
    for (const task of implementationTasks) {
      const report = await agentSpawner.spawnAndWait('codeweaver', {
        questFolder: currentQuest.folder,
        reportNumber: this.questManager.getNextReportNumber(currentQuest.folder).toString(),
        workingDirectory: process.cwd(),
        additionalContext: {
          questTitle: currentQuest.title,
          task: task,
        },
      });

      // Handle escape hatch
      if (report.escape) {
        throw new EscapeHatchError(report.escape);
      }

      // Reload quest after each agent run to get fresh data
      currentQuest = this.questManager.getQuest(quest.folder);
      if (!currentQuest) {
        throw new Error(`Failed to reload quest: ${quest.folder}`);
      }

      // Find the task in the fresh quest data
      const freshTask = currentQuest.tasks.find((t) => t.id === task.id);
      if (!freshTask) {
        throw new Error(`Task ${task.id} not found after reload`);
      }

      // Update task status
      freshTask.status = 'complete';
      freshTask.completedBy = `${this.questManager.getNextReportNumber(currentQuest.folder).toString().padStart(3, '0')}-codeweaver-report.json`;

      // Update observable actions if applicable
      this.updateObservableActions(currentQuest, freshTask);

      this.questManager.saveQuest(currentQuest);

      // Run ward validation
      await this.runWardValidation(currentQuest, agentSpawner, freshTask.id);
    }

    // Mark phase complete
    currentQuest.phases[this.getPhaseType()].status = 'complete';
    this.questManager.saveQuest(currentQuest);
  }

  getAdditionalContext(_quest: Quest): Record<string, unknown> {
    // This is not used in the overridden run method
    return {};
  }

  processAgentReport(_quest: Quest, _report: AgentReport): void {
    // This is not used in the overridden run method
  }

  private updateObservableActions(quest: Quest, task: Quest['tasks'][0]): void {
    if (!task.implementsActions || !quest.observableActions) {
      return;
    }

    for (const actionId of task.implementsActions) {
      const action = quest.observableActions.find((a) => a.id === actionId);
      if (!action) {
        continue;
      }

      const implementingTasks = quest.tasks.filter((t) => t.implementsActions?.includes(actionId));
      const allComplete = implementingTasks.every(
        (t) => t.status === 'complete' || t.status === 'skipped',
      );

      if (allComplete) {
        action.status = 'demonstrated';
      }
    }
  }

  private async runWardValidation(
    quest: Quest,
    agentSpawner: AgentSpawner,
    taskId?: string,
  ): Promise<void> {
    // Skip validation if no validator is provided
    if (!this.wardValidator) {
      return;
    }

    // Run ward validation
    const result = this.wardValidator.validate();

    // If validation passes, we're done
    if (result.success) {
      return;
    }

    // If validation fails, handle the failure
    await this.wardValidator.handleFailure(
      quest,
      result.errors || '',
      agentSpawner,
      this.questManager,
      taskId,
    );
  }
}
