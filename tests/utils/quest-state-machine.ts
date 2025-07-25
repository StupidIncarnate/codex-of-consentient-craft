// Core state machine for quest testing

import type { TaskStatus } from '../../src/models/quest';

export enum QuestStatus {
  ACTIVE = 'active',
  BLOCKED = 'blocked',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
}

export enum PhaseStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETE = 'complete',
  BLOCKED = 'blocked',
}

export enum ComponentStatus {
  QUEUED = 'queued',
  IN_PROGRESS = 'in_progress',
  COMPLETE = 'complete',
  NEEDS_REVISION = 'needs_revision',
  BLOCKED = 'blocked',
}

export interface Component {
  name: string;
  status: ComponentStatus;
  dependencies: string[];
  files?: string[];
  assignedTo?: string;
  componentType: 'implementation' | 'testing';
  testType?: 'jest' | 'playwright' | 'cypress' | 'supertest';
}

export interface Blocker {
  type:
    | 'build_failure'
    | 'test_failure'
    | 'missing_requirements'
    | 'discovery_failed'
    | 'implementation_error'
    | 'ward_failure';
  description: string;
  timestamp: string;
}

export interface Activity {
  timestamp: string;
  agent: string;
  action: string;
  details: unknown;
}

export interface Issue {
  severity: 'minor' | 'major' | 'critical';
  file: string;
  line?: number;
  message: string;
}

export interface DiscoveryPhase {
  status: PhaseStatus;
  findings?: {
    components: Array<{
      name: string;
      dependencies: string[];
    }>;
    decisions?: Record<string, string>;
  };
}

export interface ImplementationPhase {
  status: PhaseStatus;
  components: Component[];
}

export interface ReviewPhase {
  status: PhaseStatus;
  issues?: Issue[];
  recommendations?: string[];
  progress?: string;
}

export interface GapAnalysisPhase {
  status: PhaseStatus;
  analysisResults?: Array<{
    component: string;
    gapsFound: number;
    priority: 'high' | 'medium' | 'low';
  }>;
  additionalTestsNeeded?: string[];
}

export interface QuestPhases {
  discovery: DiscoveryPhase;
  implementation: ImplementationPhase;
  gapAnalysis: GapAnalysisPhase;
  review: ReviewPhase;
}

export interface ExecutionLogEntry {
  report: string;
  taskId?: string;
  timestamp: string;
  agentType?: string;
  isRecovery?: boolean;
}

export interface QuestTask {
  id: string;
  name: string;
  type: 'implementation' | 'testing';
  description: string;
  dependencies: string[];
  filesToCreate: string[];
  filesToEdit: string[];
  status: TaskStatus;
  completedBy?: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  testTechnology?: string;
}

export interface AgentReport {
  agentId: string;
  timestamp: string;
  fullReport: string[];
}

export interface CodeweaverReport extends AgentReport {
  component: string;
}

export interface AgentReports {
  pathseeker?: AgentReport[];
  codeweaver?: CodeweaverReport[];
  lawbringer?: AgentReport[];
  siegemaster?: AgentReport[];
  spiritmender?: AgentReport[];
}

export interface QuestOutcome {
  status: 'success' | 'abandoned';
  completedAt?: string;
  abandonedAt?: string;
  summary?: string;
  reason?: string;
}

export interface QuestFile {
  id: string;
  folder: string;
  title: string;
  status: QuestStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  phases: QuestPhases;
  executionLog: ExecutionLogEntry[];
  tasks: QuestTask[];
  userRequest?: string;
  abandonReason?: string;
  recoveryAttempts?: number;
  blockingErrors?: string[];

  // Legacy properties for test compatibility
  description?: string;
  complexity?: 'small' | 'medium' | 'large';
  activity: Activity[];
  agentReports: AgentReports;
  blockers?: Blocker[];
  outcome?: QuestOutcome;
  activeAgents?: Array<{ id: string; task: string }>;
  decisions?: Record<string, unknown>;
  tags?: string[];
}

// QuestTracker interface removed - using file-based quest management

// State transition rules
export class QuestStateMachine {
  private static questTransitions: Record<QuestStatus, QuestStatus[]> = {
    [QuestStatus.ACTIVE]: [
      QuestStatus.BLOCKED,
      QuestStatus.PAUSED,
      QuestStatus.COMPLETED,
      QuestStatus.ABANDONED,
    ],
    [QuestStatus.BLOCKED]: [QuestStatus.ACTIVE, QuestStatus.ABANDONED],
    [QuestStatus.PAUSED]: [QuestStatus.ACTIVE, QuestStatus.ABANDONED],
    [QuestStatus.COMPLETED]: [], // terminal state
    [QuestStatus.ABANDONED]: [], // terminal state
  };

  private static phaseTransitions: Record<PhaseStatus, PhaseStatus[]> = {
    [PhaseStatus.NOT_STARTED]: [PhaseStatus.IN_PROGRESS],
    [PhaseStatus.IN_PROGRESS]: [PhaseStatus.COMPLETE, PhaseStatus.BLOCKED],
    [PhaseStatus.COMPLETE]: [PhaseStatus.IN_PROGRESS, PhaseStatus.BLOCKED], // can go back if issues found
    [PhaseStatus.BLOCKED]: [PhaseStatus.IN_PROGRESS],
  };

  private static componentTransitions: Record<ComponentStatus, ComponentStatus[]> = {
    [ComponentStatus.QUEUED]: [ComponentStatus.IN_PROGRESS],
    [ComponentStatus.IN_PROGRESS]: [
      ComponentStatus.COMPLETE,
      ComponentStatus.BLOCKED,
      ComponentStatus.NEEDS_REVISION,
    ],
    [ComponentStatus.COMPLETE]: [ComponentStatus.NEEDS_REVISION],
    [ComponentStatus.NEEDS_REVISION]: [ComponentStatus.IN_PROGRESS],
    [ComponentStatus.BLOCKED]: [ComponentStatus.IN_PROGRESS, ComponentStatus.QUEUED],
  };

  static canTransitionQuest(from: QuestStatus, to: QuestStatus) {
    return this.questTransitions[from]?.includes(to) ?? false;
  }

  static canTransitionPhase(from: PhaseStatus, to: PhaseStatus) {
    return this.phaseTransitions[from]?.includes(to) ?? false;
  }

  static canTransitionComponent(from: ComponentStatus, to: ComponentStatus) {
    return this.componentTransitions[from]?.includes(to) ?? false;
  }

  static validateQuestTransition(quest: QuestFile, newStatus: QuestStatus) {
    if (!this.canTransitionQuest(quest.status, newStatus)) {
      throw new Error(`Invalid quest transition: ${quest.status} -> ${newStatus}`);
    }
  }

  static validatePhaseTransition(currentStatus: PhaseStatus, newStatus: PhaseStatus) {
    if (!this.canTransitionPhase(currentStatus, newStatus)) {
      throw new Error(`Invalid phase transition: ${currentStatus} -> ${newStatus}`);
    }
  }

  static getNextPhase(quest: QuestFile) {
    const phases = ['discovery', 'implementation', 'gapAnalysis', 'review'];

    for (const phase of phases) {
      const phaseStatus = quest.phases[phase as keyof QuestPhases].status;
      if (phaseStatus !== PhaseStatus.COMPLETE) {
        return phase;
      }
    }

    return null; // All phases complete
  }

  static getReadyComponents(quest: QuestFile) {
    const components = quest.phases.implementation.components;

    return components.filter((component) => {
      // Component must be queued
      if (component.status !== ComponentStatus.QUEUED) {
        return false;
      }

      // All dependencies must be complete
      return component.dependencies.every((dep) => {
        const depComponent = components.find((c) => c.name.includes(dep));
        return depComponent?.status === ComponentStatus.COMPLETE;
      });
    });
  }

  static shouldSpawnSpiritMender(quest: QuestFile) {
    return quest.status === QuestStatus.BLOCKED && (quest.blockers?.length ?? 0) > 0;
  }

  static getExpectedAction(quest: QuestFile) {
    // Check for blockers first
    if (this.shouldSpawnSpiritMender(quest)) {
      return 'spawn_spiritmender';
    }

    // Check quest status
    if (quest.status === QuestStatus.COMPLETED || quest.status === QuestStatus.ABANDONED) {
      return 'none'; // Terminal states
    }

    const nextPhase = this.getNextPhase(quest);
    if (!nextPhase) {
      return 'complete_quest';
    }

    const phaseStatus = quest.phases[nextPhase as keyof QuestPhases].status;

    switch (nextPhase) {
      case 'discovery':
        if (phaseStatus === PhaseStatus.NOT_STARTED) return 'spawn_pathseeker';
        if (phaseStatus === PhaseStatus.IN_PROGRESS) return 'continue_pathseeker';
        break;

      case 'implementation':
        if (phaseStatus === PhaseStatus.NOT_STARTED) return 'check_components';
        if (phaseStatus === PhaseStatus.IN_PROGRESS) {
          const readyComponents = this.getReadyComponents(quest);
          if (readyComponents.length > 0) return 'spawn_codeweaver';
          return 'wait_for_dependencies';
        }
        break;

      case 'gapAnalysis':
        if (phaseStatus === PhaseStatus.NOT_STARTED) return 'spawn_siegemasters';
        if (phaseStatus === PhaseStatus.IN_PROGRESS) return 'continue_siegemasters';
        break;

      case 'review':
        if (phaseStatus === PhaseStatus.NOT_STARTED) return 'spawn_lawbringer';
        if (phaseStatus === PhaseStatus.IN_PROGRESS) return 'continue_lawbringer';
        if (phaseStatus === PhaseStatus.COMPLETE) return 'run_ward_validation';
        break;
    }

    return 'unknown';
  }
}

// Standardized test phrases for orchestrator output
export const TestPhrases = {
  // Action prefixes
  PRE_ACTION_PREFIX: '[🎯]',
  MAIN_ACTION_PREFIX: '[🎲]',
  POST_ACTION_PREFIX: '[🎁]',

  // Pre-actions (status/analysis)
  CONTINUING_QUEST: '[🎯] ⚔️ Continuing quest:',
  CHECKING_DEPENDENCIES: '[🎯] 🔍 Checking dependencies...',
  ENTERING_PLANNING_MODE: '[🎯] 📋 Entering planning mode - Pathseeker needs more context...',
  NEED_CLARIFICATION: '[🎯] ❓ Need clarification:',
  COLLECTED_INFO: '[🎯] 📝 Collected:',
  RESPAWNING_PATHSEEKER: '[🎯] 🗺️ Respawning Pathseeker with enhanced context...',

  // Main actions (agent spawning)
  SPAWNING_PATHSEEKER: '[🎲] 🗺️ Summoning Pathseeker...',
  SPAWNING_SINGLE_CODEWEAVER: '[🎲] 🧵 Summoning Codeweaver for',
  SPAWNING_MULTIPLE_CODEWEAVERS: '[🎲] ⚔️⚔️ Summoning',
  SPAWNING_LAWBRINGER: '[🎲] ⚖️ Summoning Lawbringer...',
  SPAWNING_SIEGEMASTERS: '[🎲] 🏰 Summoning Siegemasters...',
  SPAWNING_SPIRITMENDER: '[🎲] ✨ Summoning Spiritmender...',
  RUNNING_WARD_VALIDATION: '[🎲] 🛡️ Running ward validation...',

  // Post-actions (results/updates)
  PARSING_REPORT: '[🎁] 📊 Parsing',
  UPDATING_QUEST: '[🎁] 💾 Updating quest state...',
  QUEST_COMPLETE: '[🎁] ✅ Quest complete!',
  QUEST_ABANDONED: '[🎁] 💀 Quest abandoned:',
  NO_ACTIVE_QUESTS: '[🎁] 📜 No active quests. Awaiting your command!',
  QUEST_BLOCKED: '[🎁] 🚫 Quest blocked:',
} as const;

// Helper to create empty quest with valid initial state
export function createEmptyQuest(id: string, title: string): QuestFile {
  const now = new Date().toISOString();

  return {
    id,
    folder: `001-${id}`,
    title,
    status: QuestStatus.ACTIVE,
    phases: {
      discovery: { status: PhaseStatus.NOT_STARTED },
      implementation: { status: PhaseStatus.NOT_STARTED, components: [] },
      gapAnalysis: { status: PhaseStatus.NOT_STARTED },
      review: { status: PhaseStatus.NOT_STARTED },
    },
    executionLog: [],
    tasks: [],
    activity: [],
    agentReports: {},
    createdAt: now,
    updatedAt: now,
  };
}

// Validation helpers
export function validateQuest(quest: QuestFile) {
  const errors: string[] = [];

  // Check required fields
  if (!quest.id) errors.push('Quest must have an id');
  if (!quest.title) errors.push('Quest must have a title');
  if (!quest.status) errors.push('Quest must have a status');
  if (!quest.phases) errors.push('Quest must have phases');

  // Validate status
  if (!Object.values(QuestStatus).includes(quest.status)) {
    errors.push(`Invalid quest status: ${quest.status}`);
  }

  // Validate phases
  if (quest.phases) {
    const requiredPhases = ['discovery', 'implementation', 'gapAnalysis', 'review'];
    for (const phase of requiredPhases) {
      if (!(phase in quest.phases)) {
        errors.push(`Missing required phase: ${phase}`);
      }
    }
  }

  // Validate phase statuses
  if (quest.phases) {
    for (const [phaseName, phase] of Object.entries(quest.phases)) {
      const typedPhase = phase as { status: PhaseStatus };
      if (!Object.values(PhaseStatus).includes(typedPhase.status)) {
        errors.push(`Invalid status for phase ${phaseName}: ${typedPhase.status}`);
      }
    }
  }

  // Validate components
  if (quest.phases?.implementation?.components) {
    for (const component of quest.phases.implementation.components) {
      if (!component.name) errors.push('Component must have a name');
      if (!Object.values(ComponentStatus).includes(component.status)) {
        errors.push(`Invalid component status: ${component.status}`);
      }
    }
  }

  return errors;
}
