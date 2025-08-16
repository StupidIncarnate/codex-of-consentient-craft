/**
 * Validation utilities for Questmaestro
 * Provides validation logic for quests, tasks, and configurations
 */

import { Quest, QuestTask, PhaseType, QuestStatus } from '../models/quest';
import { isValidAgentType } from '../models/agent';
import { WardCommands } from '../models/config';

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Validates a quest ID
 */
export function validateQuestId(id: string) {
  const errors: string[] = [];

  if (!id || id.trim().length === 0) {
    errors.push('Quest ID cannot be empty');
  }

  if (id.length > 50) {
    errors.push('Quest ID cannot be longer than 50 characters');
  }

  if (!/^[a-z0-9-]+$/.test(id)) {
    errors.push('Quest ID can only contain lowercase letters, numbers, and hyphens');
  }

  if (id.startsWith('-') || id.endsWith('-')) {
    errors.push('Quest ID cannot start or end with a hyphen');
  }

  if (id.includes('--')) {
    errors.push('Quest ID cannot contain consecutive hyphens');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a quest folder name
 */
export function validateQuestFolder(folder: string) {
  const errors: string[] = [];

  if (!folder || folder.trim().length === 0) {
    errors.push('Quest folder cannot be empty');
  }

  // Check format: 001-quest-name
  const folderPattern = /^\d{3}-[a-z0-9-]+$/;
  if (!folderPattern.test(folder)) {
    errors.push('Quest folder must match pattern: 001-quest-name');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a quest title
 */
export function validateQuestTitle(title: string) {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!title || title.trim().length === 0) {
    errors.push('Quest title cannot be empty');
  }

  if (title.length > 100) {
    errors.push('Quest title cannot be longer than 100 characters');
  }

  if (title.length < 3) {
    errors.push('Quest title must be at least 3 characters long');
  }

  // Warning for titles that might not generate good IDs
  if (/^[^a-zA-Z0-9]+$/.test(title)) {
    warnings.push('Quest title contains only special characters, which may generate a poor ID');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validates task dependencies
 */
export function validateTaskDependencies(tasks: QuestTask[]) {
  const errors: string[] = [];
  const taskIds = new Set(tasks.map((t) => t.id));

  // Check all dependencies exist
  for (const task of tasks) {
    for (const depId of task.dependencies) {
      if (!taskIds.has(depId)) {
        errors.push(`Task "${task.id}" depends on non-existent task "${depId}"`);
      }
    }

    // Check self-dependency
    if (task.dependencies.includes(task.id)) {
      errors.push(`Task "${task.id}" cannot depend on itself`);
    }
  }

  // Check for circular dependencies
  const visited = new Set<string>();
  const visiting = new Set<string>();

  const hasCycle = (taskId: string, path: string[] = []) => {
    if (visiting.has(taskId)) {
      const cycleStart = path.indexOf(taskId);
      const cycle = [...path.slice(cycleStart), taskId].join(' → ');
      errors.push(`Circular dependency detected: ${cycle}`);
      return true;
    }

    if (visited.has(taskId)) {
      return false;
    }

    visiting.add(taskId);
    path.push(taskId);

    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      for (const depId of task.dependencies) {
        if (hasCycle(depId, [...path])) {
          return true;
        }
      }
    }

    visiting.delete(taskId);
    visited.add(taskId);

    return false;
  };

  // Check each task for cycles
  for (const task of tasks) {
    if (!visited.has(task.id)) {
      hasCycle(task.id);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a task ID
 */
export function validateTaskId(id: string) {
  const errors: string[] = [];

  if (!id || id.trim().length === 0) {
    errors.push('Task ID cannot be empty');
  }

  if (id.length > 50) {
    errors.push('Task ID cannot be longer than 50 characters');
  }

  if (!/^[a-z0-9-]+$/.test(id)) {
    errors.push('Task ID can only contain lowercase letters, numbers, and hyphens');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates task file lists
 */
export function validateTaskFiles(task: QuestTask) {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for empty file lists
  if (
    task.type === 'implementation' &&
    task.filesToCreate.length === 0 &&
    task.filesToEdit.length === 0
  ) {
    warnings.push(`Implementation task "${task.id}" has no files to create or edit`);
  }

  // Check for duplicate files
  const allFiles = [...task.filesToCreate, ...task.filesToEdit];
  const uniqueFiles = new Set(allFiles);
  if (allFiles.length !== uniqueFiles.size) {
    errors.push(`Task "${task.id}" has duplicate file entries`);
  }

  // Check for files in both create and edit lists
  const createSet = new Set(task.filesToCreate);
  for (const file of task.filesToEdit) {
    if (createSet.has(file)) {
      errors.push(`Task "${task.id}" cannot both create and edit file "${file}"`);
    }
  }

  // Validate file paths
  for (const file of allFiles) {
    if (!file || file.trim().length === 0) {
      errors.push(`Task "${task.id}" has empty file path`);
    }

    if (file.startsWith('/')) {
      warnings.push(`Task "${task.id}" has absolute file path "${file}" - use relative paths`);
    }

    if (file.includes('..')) {
      errors.push(`Task "${task.id}" has file path "${file}" with parent directory reference`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validates ward commands
 */
export function validateWardCommands(commands: WardCommands) {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if any commands are defined
  const hasCommands = Object.values(commands).some(
    (cmd) => typeof cmd === 'string' && cmd.trim().length > 0,
  );
  if (!hasCommands) {
    warnings.push('No ward commands defined - validation will be skipped');
  }

  // Validate individual commands
  const commandTypes: (keyof WardCommands)[] = ['all', 'lint', 'typecheck', 'test', 'build'];

  for (const type of commandTypes) {
    const command = commands[type];
    if (command !== undefined) {
      if (typeof command !== 'string') {
        errors.push(`Ward command "${type}" must be a string`);
      } else if (command.trim().length === 0) {
        errors.push(`Ward command "${type}" cannot be empty`);
      }
    }
  }

  // Warn if individual commands exist but no 'all' command
  if (!commands.all && (commands.lint || commands.typecheck || commands.test || commands.build)) {
    warnings.push(
      'Individual ward commands defined but no "all" command - commands will be combined with &&',
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validates agent type
 */
export function validateAgentType(type: string) {
  const errors: string[] = [];

  if (!type || type.trim().length === 0) {
    errors.push('Agent type cannot be empty');
  } else if (!isValidAgentType(type)) {
    errors.push(`"${type}" is not a valid agent type`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates report file name
 */
export function validateReportFileName(fileName: string) {
  const errors: string[] = [];

  if (!fileName || fileName.trim().length === 0) {
    errors.push('Report file name cannot be empty');
  }

  // Check format: 001-agenttype-report.json
  const reportPattern = /^\d{3}-[a-z]+-report\.json$/;
  if (!reportPattern.test(fileName)) {
    errors.push('Report file must match pattern: 001-agenttype-report.json');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates quest status transition
 */
export function validateStatusTransition(currentStatus: QuestStatus, newStatus: QuestStatus) {
  const errors: string[] = [];

  // Define valid transitions
  const validTransitions: Record<QuestStatus, QuestStatus[]> = {
    in_progress: ['blocked', 'complete', 'abandoned'],
    blocked: ['in_progress', 'abandoned'],
    complete: [], // Cannot transition from complete
    abandoned: [], // Cannot transition from abandoned
  };

  const allowedTransitions = validTransitions[currentStatus];
  if (!allowedTransitions.includes(newStatus)) {
    errors.push(`Cannot transition from "${currentStatus}" to "${newStatus}"`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates phase order
 */
export function validatePhaseOrder(phases: PhaseType[]) {
  const errors: string[] = [];
  const expectedOrder: PhaseType[] = ['discovery', 'implementation', 'testing', 'review'];

  let expectedIndex = 0;
  for (const phase of phases) {
    const actualIndex = expectedOrder.indexOf(phase);
    if (actualIndex === -1) {
      errors.push(`"${phase}" is not a valid phase`);
    } else if (actualIndex < expectedIndex) {
      errors.push(`Phase "${phase}" is out of order`);
    } else {
      expectedIndex = actualIndex;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Comprehensive quest validation
 */
export function validateQuest(quest: Quest) {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate basic fields
  const idResult = validateQuestId(quest.id);
  if (!idResult.valid) {
    errors.push(...idResult.errors);
  }

  const folderResult = validateQuestFolder(quest.folder);
  if (!folderResult.valid) {
    errors.push(...folderResult.errors);
  }

  const titleResult = validateQuestTitle(quest.title);
  if (!titleResult.valid) {
    errors.push(...titleResult.errors);
  }
  if (titleResult.warnings) {
    warnings.push(...titleResult.warnings);
  }

  // Validate task dependencies
  if (quest.tasks.length > 0) {
    const depResult = validateTaskDependencies(quest.tasks);
    if (!depResult.valid) {
      errors.push(...depResult.errors);
    }

    // Validate individual tasks
    for (const task of quest.tasks) {
      const taskIdResult = validateTaskId(task.id);
      if (!taskIdResult.valid) {
        errors.push(...taskIdResult.errors);
      }

      const filesResult = validateTaskFiles(task);
      if (!filesResult.valid) {
        errors.push(...filesResult.errors);
      }
      if (filesResult.warnings) {
        warnings.push(...filesResult.warnings);
      }
    }
  }

  // Validate timestamps
  if (quest.createdAt && isNaN(Date.parse(quest.createdAt))) {
    errors.push('Invalid createdAt timestamp');
  }

  if (quest.completedAt && quest.status !== 'complete') {
    warnings.push('Quest has completedAt timestamp but status is not "complete"');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
