import type { Quest, PhaseType } from '../models/quest';
import type { AgentReport, AgentType } from '../models/agent';
import type { AgentSpawner } from '../agents/agent-spawner';
import type { WardValidator } from './ward-validator';
import type { QuestManager } from './quest-manager';
import type { FileSystem } from './file-system';
import type { Logger } from '../utils/logger';
import { BasePhaseRunner } from './base-phase-runner';
import { EscapeHatchError } from './escape-hatch-error';

// Extended lawbringer report type that includes ward validation fields
interface ExtendedLawbringerReport {
  quest: string;
  filesReviewed: string[];
  filesModified: Array<{ file: string; reason: string }>;
  standardsViolationsFixed: string[];
  wardValidationPassed?: boolean;
  integrationIssuesFound?: string[];
  qualityAssessment: string;
}

export class ReviewPhaseRunner extends BasePhaseRunner {
  constructor(
    protected questManager: QuestManager,
    protected fileSystem: FileSystem,
    protected logger: Logger,
    private wardValidator?: WardValidator,
  ) {
    super(questManager, fileSystem, logger);
  }
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

  async run(quest: Quest, agentSpawner: AgentSpawner): Promise<void> {
    // Mark phase as in_progress
    quest.phases[this.getPhaseType()].status = 'in_progress';
    this.questManager.saveQuest(quest);

    // Spawn lawbringer agent
    const report = await agentSpawner.spawnAndWait(this.getAgentType(), {
      questFolder: quest.folder,
      reportNumber: this.questManager.getNextReportNumber(quest.folder).toString(),
      workingDirectory: process.cwd(),
      additionalContext: this.getAdditionalContext(quest),
    });

    // Handle escape hatch
    if (report.escape) {
      throw new EscapeHatchError(report.escape);
    }

    // Process report
    this.processAgentReport(quest, report);

    // Check if lawbringer reported ward validation failure
    if (report.agentType === 'lawbringer' && report.status === 'complete' && this.wardValidator) {
      // The lawbringer report may have extended fields for ward validation
      const reportData = report.report as unknown as ExtendedLawbringerReport;

      // Check if this report has ward validation information
      if ('wardValidationPassed' in reportData && reportData.wardValidationPassed === false) {
        const validationErrors = Array.isArray(reportData.integrationIssuesFound)
          ? reportData.integrationIssuesFound.join(', ')
          : 'Ward validation failed';

        // Run ward validation to trigger recovery
        const result = this.wardValidator.validate();

        if (!result.success) {
          await this.wardValidator.handleFailure(
            quest,
            result.errors || validationErrors,
            agentSpawner,
            this.questManager,
            undefined, // No specific task ID for review phase
          );
        }
      }
    }

    // Mark phase complete
    quest.phases[this.getPhaseType()].status = 'complete';
    this.questManager.saveQuest(quest);
  }
}
