/**
 * Quest-related interfaces and types for Questmaestro
 */

import { PathseekerTask } from './agent';

/**
 * Quest status types
 */
export type QuestStatus = 'in_progress' | 'blocked' | 'complete' | 'abandoned';

/**
 * Phase status types
 */
export type PhaseStatus = 'pending' | 'in_progress' | 'complete' | 'blocked' | 'skipped';

/**
 * Task status types
 */
export type TaskStatus = 'pending' | 'in_progress' | 'complete' | 'failed' | 'skipped';

/**
 * Quest phase types
 */
export type PhaseType = 'discovery' | 'implementation' | 'testing' | 'review';

/**
 * A phase in the quest lifecycle
 */
export interface QuestPhase {
  /**
   * Current status of the phase
   */
  status: PhaseStatus;

  /**
   * Report file that completed this phase
   */
  report?: string;

  /**
   * Progress tracking (e.g., "2/4" for implementation)
   */
  progress?: string;

  /**
   * When the phase started
   */
  startedAt?: string;

  /**
   * When the phase completed
   */
  completedAt?: string;
}

/**
 * Execution log entry
 */
export interface ExecutionLogEntry {
  /**
   * Report filename
   */
  report: string;

  /**
   * Task ID if this was for a specific task
   */
  taskId?: string;

  /**
   * Timestamp of execution
   */
  timestamp: string;

  /**
   * Agent type that created this report
   */
  agentType?: string;

  /**
   * Whether this was a recovery attempt
   */
  isRecovery?: boolean;
}

/**
 * Extended task with status tracking
 */
export interface QuestTask extends PathseekerTask {
  /**
   * Current status of the task
   */
  status: TaskStatus;

  /**
   * Report that completed this task
   */
  completedBy?: string;

  /**
   * When the task started
   */
  startedAt?: string;

  /**
   * When the task completed
   */
  completedAt?: string;

  /**
   * Error message if failed
   */
  errorMessage?: string;
}

/**
 * Main quest structure
 */
export interface Quest {
  /**
   * Unique identifier (slugified title)
   */
  id: string;

  /**
   * Folder name (e.g., "001-add-authentication")
   */
  folder: string;

  /**
   * Human-readable title
   */
  title: string;

  /**
   * Current quest status
   */
  status: QuestStatus;

  /**
   * When the quest was created
   */
  createdAt: string;

  /**
   * When the quest was last updated
   */
  updatedAt?: string;

  /**
   * When the quest was completed
   */
  completedAt?: string;

  /**
   * Quest phases
   */
  phases: {
    discovery: QuestPhase;
    implementation: QuestPhase;
    testing: QuestPhase;
    review: QuestPhase;
  };

  /**
   * Execution history
   */
  executionLog: ExecutionLogEntry[];

  /**
   * All tasks discovered for this quest
   */
  tasks: QuestTask[];

  /**
   * Original user request
   */
  userRequest?: string;

  /**
   * Reason for abandonment if abandoned
   */
  abandonReason?: string;

  /**
   * Number of recovery attempts
   */
  recoveryAttempts?: number;

  /**
   * Ward validation errors if blocked
   */
  blockingErrors?: string[];
}

/**
 * Quest tracker entry (simplified for list view)
 */
export interface QuestTrackerEntry {
  id: string;
  folder: string;
  title: string;
  status: QuestStatus;
  createdAt: string;
  currentPhase?: PhaseType;
  taskProgress?: string; // e.g., "3/5 tasks complete"
}

/**
 * Creates a new quest object
 */
export function createQuest(
  id: string,
  folder: string,
  title: string,
  userRequest?: string,
): Quest {
  const now = new Date().toISOString();

  return {
    id,
    folder,
    title,
    status: 'in_progress' as QuestStatus,
    createdAt: now,
    updatedAt: now,
    phases: {
      discovery: { status: 'pending' as PhaseStatus },
      implementation: { status: 'pending' as PhaseStatus },
      testing: { status: 'pending' as PhaseStatus },
      review: { status: 'pending' as PhaseStatus },
    },
    executionLog: [] as ExecutionLogEntry[],
    tasks: [] as QuestTask[],
    userRequest,
  };
}

/**
 * Gets the current phase of a quest
 */
export function getCurrentPhase(quest: Quest): PhaseType | null {
  const phaseOrder: PhaseType[] = ['discovery', 'implementation', 'testing', 'review'];

  for (const phase of phaseOrder) {
    if (quest.phases[phase].status === 'in_progress' || quest.phases[phase].status === 'blocked') {
      return phase;
    }
  }

  // Check if any phase is still pending
  for (const phase of phaseOrder) {
    if (quest.phases[phase].status === 'pending') {
      return phase;
    }
  }

  return null;
}

/**
 * Calculates task progress for a quest
 */
export function calculateTaskProgress(quest: Quest): string {
  const completedTasks = quest.tasks.filter((t) => t.status === 'complete').length;
  const totalTasks = quest.tasks.length;

  return totalTasks > 0 ? `${completedTasks}/${totalTasks}` : '0/0';
}

/**
 * Determines if a quest can proceed to the next phase
 */
export function canProceedToNextPhase(quest: Quest, currentPhase: PhaseType): boolean {
  switch (currentPhase) {
    case 'discovery':
      // Can proceed if discovery is complete and has tasks
      return quest.phases.discovery.status === 'complete' && quest.tasks.length > 0;

    case 'implementation':
      // Can proceed if all implementation tasks are complete
      const implementationTasks = quest.tasks.filter((t) => t.type === 'implementation');
      return implementationTasks.every((t) => t.status === 'complete' || t.status === 'skipped');

    case 'testing':
      // Can proceed if testing phase is complete
      return (
        quest.phases.testing.status === 'complete' || quest.phases.testing.status === 'skipped'
      );

    case 'review':
      // Review is the final phase
      return quest.phases.review.status === 'complete';

    default:
      return false;
  }
}

/**
 * Creates a quest tracker entry from a full quest
 */
export function toTrackerEntry(quest: Quest): QuestTrackerEntry {
  return {
    id: quest.id,
    folder: quest.folder,
    title: quest.title,
    status: quest.status,
    createdAt: quest.createdAt,
    currentPhase: getCurrentPhase(quest) ?? undefined,
    taskProgress: calculateTaskProgress(quest),
  };
}
