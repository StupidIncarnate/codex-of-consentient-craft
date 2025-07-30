import type { Quest, PhaseType } from '../models/quest';
import type { AgentReport, AgentType } from '../models/agent';
import { BasePhaseRunner } from './base-phase-runner';

export class TestingPhaseRunner extends BasePhaseRunner {
  getAgentType(): AgentType {
    return 'siegemaster';
  }

  getPhaseType(): PhaseType {
    return 'testing';
  }

  canRun(quest: Quest): boolean {
    const hasCompletedImplementationTasks = quest.tasks.some(
      (t) => t.type === 'implementation' && t.status === 'complete',
    );
    return super.canRun(quest) && hasCompletedImplementationTasks;
  }

  getAdditionalContext(quest: Quest): Record<string, unknown> {
    return {
      questTitle: quest.title,
      filesCreated: this.questManager.getCreatedFiles(quest.folder),
      testFramework: this.detectTestFramework(),
      observableActions: quest.observableActions,
    };
  }

  processAgentReport(_quest: Quest, _report: AgentReport): void {
    // Siegemaster report processing if needed
  }

  private detectTestFramework(): string {
    // Test framework detection logic
    return 'jest'; // Default for now
  }
}
