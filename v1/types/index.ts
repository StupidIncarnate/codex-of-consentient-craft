/**
 * Centralized type exports for Questmaestro
 *
 * This file re-exports all types from the models directory
 * and adds any additional types needed throughout the application
 */

// Re-export all quest-related types
import { PathseekerTask } from '../models/agent';

export * from '../models/quest';

// Re-export all agent-related types
export * from '../models/agent';

// Re-export all config-related types
export * from '../models/config';

// Re-export all hook-related types
export * from '../../src/types/hooks';

// Additional utility types that don't fit in specific model files

/**
 * Generic result type for operations that can fail
 */
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

/**
 * CLI command types
 */
export type CliCommand = 'list' | 'abandon' | 'start' | 'clean' | 'default';

/**
 * File operation result
 */
export type FileOperationResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
  path?: string;
};

/**
 * Agent spawn options
 */
export type AgentSpawnOptions = {
  timeout?: number;
  env?: NodeJS.ProcessEnv;
  cwd?: string;
};

/**
 * Quest folder structure
 */
export type QuestFolderStructure = {
  root: string; // questmaestro/
  active: string; // questmaestro/active/
  completed: string; // questmaestro/completed/
  abandoned: string; // questmaestro/abandoned/
  retros: string; // questmaestro/retros/
  lore: string; // questmaestro/lore/
  discovery: string; // questmaestro/discovery/
};

/**
 * Quest folder patterns
 */
export type QuestFolderInfo = {
  number: string; // "001", "002", etc.
  name: string; // "add-authentication"
  fullPath: string;
};

/**
 * Report file info
 */
export type ReportFileInfo = {
  number: string; // "001", "002", etc.
  agentType: string; // "pathseeker", "codeweaver", etc.
  fullPath: string;
  exists: boolean;
};

/**
 * Ward validation result
 */
export type WardResult = {
  success: boolean;
  command: string;
  output: string;
  errors?: WardError[];
};

/**
 * Ward error details
 */
export type WardError = {
  type: 'lint' | 'typecheck' | 'test' | 'build' | 'unknown';
  file?: string;
  line?: number;
  message: string;
  raw: string;
};

/**
 * Quest list display entry
 */
export type QuestListEntry = {
  number: string;
  title: string;
  status: string;
  phase?: string;
  progress?: string;
  lastUpdated: string;
};

/**
 * Lore entry structure
 */
export type LoreEntry = {
  filename: string;
  category: string;
  title: string;
  content: string;
  relatedQuest?: string;
  createdAt: string;
};

/**
 * File watcher event
 */
export type FileWatchEvent = {
  type: 'created' | 'modified' | 'deleted';
  path: string;
  timestamp: number;
};

/**
 * Agent execution context passed via $ARGUMENTS
 */
export type AgentExecutionContext = {
  userRequest?: string;
  workingDirectory: string;
  questFolder: string;
  reportNumber: string;
  mode?: string;
  task?: PathseekerTask; // PathseekerTask for implementation
  wardErrors?: string; // For Spiritmender
  previousReports?: string[]; // For recovery/validation
  attemptNumber?: number; // For Spiritmender retries
};

/**
 * CLI argument parsing result
 */
export type ParsedArgs = {
  command: CliCommand;
  args: string[];
  rawInput: string;
};

/**
 * Quest creation options
 */
export type QuestCreationOptions = {
  title: string;
  userRequest: string;
  skipDiscovery?: boolean;
};

/**
 * Discovery report reference
 */
export type DiscoveryReportRef = {
  filename: string;
  packageName: string;
  timestamp: string;
  selected?: boolean;
};

/**
 * Time formatting options
 */
export type TimeFormatOptions = {
  relative?: boolean;
  includeTime?: boolean;
};
