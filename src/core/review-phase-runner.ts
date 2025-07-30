import type { Quest, PhaseType } from '../models/quest';
import type { AgentReport, AgentType } from '../models/agent';
import { BasePhaseRunner } from './base-phase-runner';

export class ReviewPhaseRunner extends BasePhaseRunner {
  getAgentType(): AgentType {
    return 'lawbringer';
  }

  getPhaseType(): PhaseType {
    return 'review';
  }

  canRun(quest: Quest): boolean {
    const hasChangedFiles = this.questManager.getChangedFiles(quest.folder).length > 0;
    return super.canRun(quest) && hasChangedFiles;
  }

  getAdditionalContext(quest: Quest): Record<string, unknown> {
    return {
      questTitle: quest.title,
      changedFiles: this.questManager.getChangedFiles(quest.folder),
    };
  }

  processAgentReport(_quest: Quest, _report: AgentReport): void {
    // Lawbringer report processing if needed
  }
}
