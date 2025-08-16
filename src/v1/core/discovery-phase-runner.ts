import type { Quest, PhaseType } from '../models/quest';
import type { AgentReport, AgentType, PathseekerTask, ReconciliationPlan } from '../models/agent';
import { BasePhaseRunner } from './base-phase-runner';

export class DiscoveryPhaseRunner extends BasePhaseRunner {
  getAgentType(): AgentType {
    return 'pathseeker';
  }

  getPhaseType(): PhaseType {
    return 'discovery';
  }

  getAdditionalContext(quest: Quest): Record<string, unknown> {
    // Check if this is a refinement request
    if (quest.needsRefinement && quest.refinementRequests && quest.refinementRequests.length > 0) {
      const latestRequest = quest.refinementRequests[quest.refinementRequests.length - 1];
      return {
        mode: 'refinement',
        latestRequest: latestRequest,
        allRequests: quest.refinementRequests,
        currentTasks: quest.tasks,
        completedTasks: quest.tasks.filter((t) => t.status === 'complete'),
        userRequest: quest.userRequest,
        quest: quest,
      };
    }

    const hasExistingTasks = quest.tasks.length > 0;

    if (hasExistingTasks) {
      return {
        mode: 'validation',
        existingTasks: quest.tasks,
        quest: quest,
      };
    } else {
      return {
        mode: 'creation',
        userRequest: quest.userRequest,
        quest: quest,
      };
    }
  }

  processAgentReport(quest: Quest, report: AgentReport): void {
    if (report.agentType !== 'pathseeker' || !report.report) {
      return;
    }

    // Clear refinement flag if we were in refinement mode
    if (quest.needsRefinement) {
      quest.needsRefinement = false;
    }

    const pathseekerReport = report.report as {
      tasks?: PathseekerTask[];
      observableActions?: Array<{
        id: string;
        description: string;
        successCriteria: string;
        failureBehavior?: string;
        implementedByTasks: string[];
      }>;
      reconciliationPlan?: ReconciliationPlan;
    };

    // Handle validation mode
    if (quest.tasks.length > 0) {
      if ('reconciliationPlan' in pathseekerReport && pathseekerReport.reconciliationPlan) {
        this.questManager.applyReconciliation(quest.id, pathseekerReport.reconciliationPlan);
      } else if ('tasks' in pathseekerReport && Array.isArray(pathseekerReport.tasks)) {
        const result = this.questManager.addTasks(quest.folder, pathseekerReport.tasks);
        if (result.success && result.data) {
          // Update the quest object with the new tasks
          quest.tasks = result.data.tasks;
        }
      }
    } else {
      // Creation mode
      if (pathseekerReport.tasks && Array.isArray(pathseekerReport.tasks)) {
        const result = this.questManager.addTasks(quest.folder, pathseekerReport.tasks);
        if (result.success && result.data) {
          // Update the quest object with the new tasks
          quest.tasks = result.data.tasks;
        }
      }

      if (pathseekerReport.observableActions && Array.isArray(pathseekerReport.observableActions)) {
        quest.observableActions = pathseekerReport.observableActions.map((action) => ({
          ...action,
          status: 'pending' as const,
        }));
      }
    }
  }
}
