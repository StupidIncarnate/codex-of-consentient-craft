import type { Quest, PhaseType } from '../models/quest';
import type { AgentReport, AgentType } from '../models/agent';
import type { AgentSpawner } from '../agents/agent-spawner';
import { BasePhaseRunner } from './base-phase-runner';
import { EscapeHatchError } from './escape-hatch-error';

export class ImplementationPhaseRunner extends BasePhaseRunner {
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
    const implementationTasks = quest.tasks.filter(
      (t) => t.type === 'implementation' && t.status !== 'complete',
    );

    if (implementationTasks.length === 0) {
      return;
    }

    // Mark phase as in_progress
    quest.phases[this.getPhaseType()].status = 'in_progress';
    this.questManager.saveQuest(quest);

    // Process each task sequentially
    for (const task of implementationTasks) {
      const report = await agentSpawner.spawnAndWait('codeweaver', {
        questFolder: quest.folder,
        reportNumber: this.questManager.getNextReportNumber(quest.folder).toString(),
        workingDirectory: process.cwd(),
        additionalContext: {
          questTitle: quest.title,
          task: task,
        },
      });

      // Handle escape hatch
      if (report.escape) {
        throw new EscapeHatchError(report.escape);
      }

      // Update task status
      task.status = 'complete';
      task.completedBy = `${this.questManager.getNextReportNumber(quest.folder).toString().padStart(3, '0')}-codeweaver-report.json`;

      // Update observable actions if applicable
      if (task.implementsActions && quest.observableActions) {
        for (const actionId of task.implementsActions) {
          const action = quest.observableActions.find((a) => a.id === actionId);
          if (action) {
            const implementingTasks = quest.tasks.filter((t) =>
              t.implementsActions?.includes(actionId),
            );
            const allComplete = implementingTasks.every(
              (t) => t.status === 'complete' || t.status === 'skipped',
            );
            if (allComplete) {
              action.status = 'demonstrated';
            }
          }
        }
      }

      this.questManager.saveQuest(quest);

      // Run ward validation
      await this.runWardValidation(quest, agentSpawner);
    }

    // Mark phase complete
    quest.phases[this.getPhaseType()].status = 'complete';
    this.questManager.saveQuest(quest);
  }

  getAdditionalContext(_quest: Quest): Record<string, unknown> {
    // This is not used in the overridden run method
    return {};
  }

  processAgentReport(_quest: Quest, _report: AgentReport): void {
    // This is not used in the overridden run method
  }

  private async runWardValidation(_quest: Quest, _agentSpawner: AgentSpawner): Promise<void> {
    // Ward validation logic will be implemented separately
    // For now, this is a placeholder
  }
}
