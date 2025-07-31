import type { Quest } from '../models/quest';
import type { QuestManager } from './quest-manager';
import type { Logger } from '../utils/logger';
import type { AgentSpawner } from '../agents/agent-spawner';
import type { PhaseRunner } from './phase-runner-interface';
import { EscapeHatchError } from './escape-hatch-error';

export class QuestOrchestrator {
  constructor(
    private questManager: QuestManager,
    private logger: Logger,
    private phaseRunners: Map<string, PhaseRunner>,
  ) {}

  async runQuest(quest: Quest, agentSpawner: AgentSpawner): Promise<void> {
    this.logger.bright(`\n⚔️ Quest: ${quest.title}\n`);

    // Check quest freshness before continuing
    if (!(await this.checkAndWarnStaleness(quest))) {
      return;
    }

    // Handle blocked quest
    if (!(await this.handleBlockedQuest(quest))) {
      return;
    }

    // Sequential phase execution
    let currentQuest = quest;
    while (!this.questManager.isQuestComplete(currentQuest)) {
      const phase = this.questManager.getCurrentPhase(currentQuest);

      this.logger.info(`Current phase: ${phase}`);

      if (phase === null) {
        // All phases complete
        this.completeQuest(currentQuest);
        return;
      }

      try {
        await this.executePhase(currentQuest, phase, agentSpawner);
      } catch (error) {
        if (error instanceof EscapeHatchError) {
          this.logger.error(`Agent triggered escape hatch: ${error.escape.reason}`);
          this.logger.info(`Analysis: ${error.escape.analysis}`);
          this.logger.info(`Recommendation: ${error.escape.recommendation}`);
          currentQuest.status = 'blocked';
          this.questManager.saveQuest(currentQuest);
          return;
        }
        throw error;
      }

      // Reload quest to get latest state
      const reloadedQuest = this.questManager.getQuest(currentQuest.folder);
      if (!reloadedQuest) {
        this.logger.error('Failed to reload quest');
        return;
      }
      currentQuest = reloadedQuest;
    }

    this.completeQuest(currentQuest);
  }

  completeQuest(quest: Quest): void {
    this.logger.bright(`\n✨ Quest Complete: ${quest.title} ✨\n`);

    // Generate and save retrospective
    const retrospective = this.questManager.generateRetrospective(quest.folder);
    this.questManager.saveRetrospective(quest.folder, retrospective);

    // Move quest to completed
    this.questManager.completeQuest(quest.folder);

    this.logger.info('Quest has been moved to completed folder.');
    this.logger.info(`Retrospective saved to: questmaestro/retros/`);
  }

  async checkAndWarnStaleness(quest: Quest): Promise<boolean> {
    const freshness = this.questManager.validateQuestFreshness(quest);

    if (freshness.isStale) {
      this.logger.warn(`⚠️  ${freshness.reason}`);
      console.log('The codebase may have changed significantly since this quest was created.');
      console.log('Continuing may lead to conflicts or errors.\n');

      const answer = await this.getUserInput('Continue anyway? (y/n): ');
      if (answer.toLowerCase() !== 'y') {
        console.log('\nQuest cancelled. Create a fresh quest with: questmaestro "your request"');
        return false;
      }
    }

    return true;
  }

  async handleBlockedQuest(quest: Quest): Promise<boolean> {
    if (quest.status !== 'blocked') {
      return true;
    }

    this.logger.yellow(`Quest is blocked`);
    const resume = await this.getUserInput('Resume quest? (y/n): ');
    if (resume.toLowerCase() !== 'y') {
      return false;
    }

    quest.status = 'in_progress';
    this.questManager.saveQuest(quest);
    return true;
  }

  async executePhase(quest: Quest, phase: string, agentSpawner: AgentSpawner): Promise<void> {
    const phaseRunner = this.getCurrentPhaseRunner(phase);
    if (!phaseRunner) {
      this.logger.error(`Unknown phase: ${phase}`);
      return;
    }

    if (phaseRunner.canRun(quest)) {
      await phaseRunner.run(quest, agentSpawner);
    } else {
      // Skip to next phase if can't run (e.g., no tasks for this phase)
      if (phase in quest.phases) {
        quest.phases[phase as keyof typeof quest.phases].status = 'skipped';
        this.questManager.saveQuest(quest);
      } else {
        this.logger.error(`Invalid phase key: ${phase}`);
      }
    }
  }

  getCurrentPhaseRunner(phase: string): PhaseRunner | null {
    return this.phaseRunners.get(phase) || null;
  }

  async getUserInput(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      process.stdout.write(prompt);
      process.stdin.once('data', (data) => {
        resolve(data.toString().trim());
      });
    });
  }
}
