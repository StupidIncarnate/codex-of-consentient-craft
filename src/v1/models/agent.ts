/**
 * Agent-related interfaces and types for Questmaestro
 */

/**
 * Types of agents in the fellowship
 */
export type AgentType =
  | 'voidpoker'
  | 'pathseeker'
  | 'codeweaver'
  | 'siegemaster'
  | 'lawbringer'
  | 'spiritmender';

/**
 * Agent execution modes
 */
export type AgentMode =
  | 'creation' // Creating new quest/tasks
  | 'validation' // Validating existing work
  | 'recovery_assessment' // Assessing partial work after crash
  | 'implementation' // Implementing code
  | 'testing' // Creating tests
  | 'review' // Reviewing code
  | 'fixing'; // Fixing errors

/**
 * Status of agent execution
 */
export type AgentStatus = 'complete' | 'blocked' | 'error';

/**
 * Escape hatch reasons when agent hits limits
 */
export type EscapeReason =
  | 'task_too_complex'
  | 'context_exhaustion'
  | 'unexpected_dependencies'
  | 'integration_conflict'
  | 'repeated_failures';

/**
 * Retrospective note categories for lore accumulation
 */
export type RetrospectiveCategory =
  | 'what_worked_well'
  | 'unexpected_challenge'
  | 'pattern_discovered'
  | 'tool_limitation'
  | 'project_insight'
  | 'debugging_approach'
  | 'architecture_decision';

/**
 * A retrospective note for the lore system
 */
export interface RetrospectiveNote {
  category: RetrospectiveCategory;
  note: string;
  /**
   * Optional file paths related to this note
   */
  relatedFiles?: string[];
}

/**
 * Base structure for all agent reports
 */
export interface BaseAgentReport {
  /**
   * Status of the agent execution
   */
  status: AgentStatus;

  /**
   * If blocked, describes what the agent needs
   */
  blockReason?: string;

  /**
   * Type of agent that created this report
   */
  agentType: AgentType;

  /**
   * Task ID if this report relates to a specific task
   */
  taskId?: string;

  /**
   * Agent-specific report data
   */
  report: unknown;

  /**
   * Notes for the retrospective/lore system
   */
  retrospectiveNotes?: RetrospectiveNote[];

  /**
   * Escape hatch data when agent hits limits
   */
  escape?: {
    reason: EscapeReason;
    analysis: string;
    recommendation: string;
    retro: string;
    partialWork?: string;
  };
}

/**
 * Pathseeker task definition
 */
export interface PathseekerTask {
  id: string;
  name: string;
  type: 'implementation' | 'testing';
  description: string;
  dependencies: string[];
  filesToCreate: string[];
  filesToEdit: string[];
  /**
   * For testing tasks
   */
  testTechnology?: string;
}

/**
 * Recovery assessment data
 */
export interface RecoveryAssessment {
  /**
   * Files that were fully completed
   */
  files_completed: string[];
  /**
   * Files that were partially modified
   */
  files_partial: string[];
  /**
   * Files that still need to be created/modified
   */
  files_missing: string[];
  /**
   * Recommendation for recovery approach
   */
  recommendation: 'continue' | 'restart' | 'manual_intervention';
  /**
   * Reason for the recommendation
   */
  reason: string;
}

/**
 * Reconciliation plan for updating quest tasks
 */
export interface ReconciliationPlan {
  mode: 'EXTEND' | 'CONTINUE' | 'REPLAN';
  newTasks?: PathseekerTask[];
  taskUpdates?: Array<{
    taskId: string;
    newDependencies: string[];
  }>;
  obsoleteTasks?: Array<{
    taskId: string;
    reason: string;
  }>;
}

/**
 * Observable action definition from Pathseeker
 */
export interface PathseekerObservableAction {
  id: string;
  description: string;
  successCriteria: string;
  failureBehavior?: string;
  implementedByTasks: string[];
}

/**
 * Pathseeker-specific report
 */
export interface PathseekerReport extends BaseAgentReport {
  agentType: 'pathseeker';
  report: {
    tasks: PathseekerTask[];
    /**
     * Observable actions discovered through user dialogue
     */
    observableActions?: PathseekerObservableAction[];
    /**
     * Overall approach or strategy
     */
    approach?: string;
    /**
     * Any important notes or warnings
     */
    notes?: string[];
    /**
     * Recovery assessment when in recovery_assessment mode
     */
    recoveryAssessment?: RecoveryAssessment;
    /**
     * Reconciliation plan when in validation mode
     */
    reconciliationPlan?: ReconciliationPlan;
  };
}

/**
 * Codeweaver-specific report
 */
export interface CodeweaverReport extends BaseAgentReport {
  agentType: 'codeweaver';
  report: {
    filesCreated: string[];
    filesModified: string[];
    /**
     * Brief summary of what was implemented
     */
    summary: string;
    /**
     * Any issues encountered
     */
    issues?: string[];
  };
}

/**
 * Siegemaster-specific report
 */
export interface SiegemasterReport extends BaseAgentReport {
  agentType: 'siegemaster';
  report: {
    testGapsFound: Array<{
      file: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
    }>;
    testsCreated: string[];
    coverageImprovement?: {
      before: number;
      after: number;
    };
  };
}

/**
 * Lawbringer-specific report
 */
export interface LawbringerReport extends BaseAgentReport {
  agentType: 'lawbringer';
  report: {
    issues: Array<{
      file: string;
      line?: number;
      severity: 'critical' | 'major' | 'minor';
      category: 'style' | 'pattern' | 'security' | 'performance' | 'maintainability';
      message: string;
      suggestion?: string;
    }>;
    filesReviewed: string[];
    overallAssessment: 'approved' | 'needs_work' | 'blocked';
  };
}

/**
 * Spiritmender-specific report
 */
export interface SpiritmenderReport extends BaseAgentReport {
  agentType: 'spiritmender';
  report: {
    errorsFixed: Array<{
      file: string;
      errorType: 'lint' | 'typecheck' | 'test' | 'build';
      description: string;
      resolution: string;
    }>;
    filesModified: string[];
    remainingErrors?: string[];
    attemptNumber: number;
  };
}

/**
 * Voidpoker-specific report
 */
export interface VoidpokerReport extends BaseAgentReport {
  agentType: 'voidpoker';
  report: {
    projectStructure: {
      type: 'node' | 'web' | 'monorepo' | 'library' | 'cli';
      mainTechnologies: string[];
      testFramework?: string;
      buildTool?: string;
    };
    discovery: {
      entryPoints: string[];
      keyDirectories: string[];
      configFiles: string[];
      conventions: {
        testPattern?: string;
        sourcePattern?: string;
      };
    };
    recommendations: {
      wardCommands?: {
        all?: string;
        lint?: string;
        typecheck?: string;
        test?: string;
        build?: string;
      };
      architectureNotes?: string[];
    };
  };
}

/**
 * Union type of all specific agent reports
 */
export type AgentReport =
  | PathseekerReport
  | CodeweaverReport
  | SiegemasterReport
  | LawbringerReport
  | SpiritmenderReport
  | VoidpokerReport;

/**
 * Agent context that gets passed when spawning
 */
export interface AgentContext {
  /**
   * User's original request
   */
  userRequest?: string;

  /**
   * Current working directory
   */
  workingDirectory: string;

  /**
   * Quest folder name (e.g., "001-add-authentication")
   */
  questFolder: string;

  /**
   * Report number for this agent (e.g., "002")
   */
  reportNumber: string;

  /**
   * Mode the agent should operate in
   */
  mode?: AgentMode;

  /**
   * Ward commands configuration
   */
  wardCommands?: {
    all?: string;
    [key: string]: string | undefined;
  };

  /**
   * Recovery mode flag
   */
  recoveryMode?: boolean;

  /**
   * Previous report numbers if in recovery/continuation mode
   */
  previousReportNumbers?: string[];

  /**
   * User guidance for blocked agent continuation
   */
  userGuidance?: string;

  /**
   * Indicates continuation mode after being blocked
   */
  continuationMode?: boolean;

  /**
   * Previous report number for continuation
   */
  previousReportNumber?: string;

  /**
   * Additional context specific to agent type
   */
  additionalContext?: unknown;
}

/**
 * Type guard for agent reports
 */
export function isAgentReport(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const report = value as BaseAgentReport;

  // Check required base fields
  if (!report.status || !['complete', 'blocked', 'error'].includes(report.status)) {
    return false;
  }

  if (!report.agentType || !isValidAgentType(report.agentType)) {
    return false;
  }

  if (!report.report || typeof report.report !== 'object') {
    return false;
  }

  return true;
}

/**
 * Check if a string is a valid agent type
 */
export function isValidAgentType(type: string): boolean {
  const validTypes: AgentType[] = [
    'voidpoker',
    'pathseeker',
    'codeweaver',
    'siegemaster',
    'lawbringer',
    'spiritmender',
  ];
  return validTypes.includes(type as AgentType);
}
