import type { Quest } from '../models/quest';
import type { QuestManager } from './quest-manager';
import type { Logger } from '../utils/logger';
import type { FileSystem } from './file-system';
import { AgentSpawner } from '../agents/agent-spawner';
import type { PhaseRunner } from './phase-runner-interface';
import { DiscoveryPhaseRunner } from './discovery-phase-runner';
import { ImplementationPhaseRunner } from './implementation-phase-runner';
import { TestingPhaseRunner } from './testing-phase-runner';
import { ReviewPhaseRunner } from './review-phase-runner';
import { WardValidator } from './ward-validator';
import { EscapeHatchError } from './escape-hatch-error';

export class QuestOrchestrator {
  private phaseRunners: Map<string, PhaseRunner>;
  private agentSpawner: AgentSpawner;
  private wardValidator: WardValidator;

  constructor(
    private questManager: QuestManager,
    fileSystem: FileSystem,
    private logger: Logger,
  ) {
    // Initialize ward validator
    this.wardValidator = new WardValidator(fileSystem, logger);

    // Initialize phase runners
    this.phaseRunners = new Map([
      ['discovery', new DiscoveryPhaseRunner(questManager, fileSystem, logger)],
      [
        'implementation',
        new ImplementationPhaseRunner(questManager, fileSystem, logger, this.wardValidator),
      ],
      ['testing', new TestingPhaseRunner(questManager, fileSystem, logger)],
      ['review', new ReviewPhaseRunner(questManager, fileSystem, logger, this.wardValidator)],
    ]);

    // Initialize agent spawner with quest manager for recovery tracking
    this.agentSpawner = new AgentSpawner(questManager);
  }

  async runQuest(quest: Quest): Promise<void> {
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

    while (true) {
      // ALWAYS reload quest at start of loop to get latest state
      const latestQuest = this.questManager.getQuest(currentQuest.folder);
      if (!latestQuest) {
        this.logger.error('Failed to reload quest');
        return;
      }
      currentQuest = latestQuest;

      // Check if quest is complete with fresh data
      if (this.questManager.isQuestComplete(currentQuest)) {
        this.completeQuest(currentQuest);
        return;
      }

      const phase = this.questManager.getCurrentPhase(currentQuest);
      this.logger.info(`Current phase: ${phase}`);

      if (phase === null) {
        // All phases complete but quest not complete - likely pending tasks
        this.logger.warn('All phases complete but quest has pending tasks. Unable to proceed.');
        return;
      }

      try {
        await this.executePhase(currentQuest, phase, this.agentSpawner);
      } catch (error) {
        if (error instanceof EscapeHatchError) {
          this.logger.warn(`Agent requesting refinement: ${error.escape.reason}`);
          this.logger.info(`Finding: ${error.escape.analysis}`);
          this.logger.info(`Suggestion: ${error.escape.recommendation}`);

          // Add refinement request
          if (!currentQuest.refinementRequests) {
            currentQuest.refinementRequests = [];
          }

          const currentAgent = this.phaseRunners.get(phase)?.getAgentType() || phase;
          currentQuest.refinementRequests.push({
            fromAgent: currentAgent,
            timestamp: new Date().toISOString(),
            finding: error.escape.analysis,
            suggestion: error.escape.recommendation,
            reportNumber: this.questManager.getNextReportNumber(currentQuest.folder).toString(),
          });

          // Mark discovery for refinement
          currentQuest.phases.discovery.status = 'pending';
          currentQuest.needsRefinement = true;

          // Save and continue (not return)
          this.questManager.saveQuest(currentQuest);
          this.logger.info('Returning to discovery for refinement...');
        } else {
          throw error;
        }
      }
    }
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
