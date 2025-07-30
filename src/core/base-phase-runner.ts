import type { Quest, PhaseType } from '../models/quest';
import type { AgentSpawner } from '../agents/agent-spawner';
import type { AgentReport, AgentType } from '../models/agent';
import type { QuestManager } from './quest-manager';
import type { FileSystem } from './file-system';
import type { PhaseRunner } from './phase-runner-interface';
import { Logger } from '../utils/logger';
import { EscapeHatchError } from './escape-hatch-error';

export abstract class BasePhaseRunner implements PhaseRunner {
  constructor(
    protected questManager: QuestManager,
    protected fileSystem: FileSystem,
    protected logger: Logger = new Logger(),
  ) {}

  abstract getAgentType(): AgentType;
  abstract getPhaseType(): PhaseType;
  abstract processAgentReport(quest: Quest, report: AgentReport): void;
  abstract getAdditionalContext(quest: Quest): Record<string, unknown>;

  async run(quest: Quest, agentSpawner: AgentSpawner): Promise<void> {
    // Mark phase as in_progress
    quest.phases[this.getPhaseType()].status = 'in_progress';
    this.questManager.saveQuest(quest);

    // Spawn agent
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

    // Mark phase complete
    quest.phases[this.getPhaseType()].status = 'complete';
    this.questManager.saveQuest(quest);
  }

  canRun(quest: Quest): boolean {
    return quest.phases[this.getPhaseType()].status === 'pending';
  }
}
