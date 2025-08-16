import {
  validateQuestId,
  validateQuestFolder,
  validateQuestTitle,
  validateTaskDependencies,
  validateTaskId,
  validateTaskFiles,
  validateWardCommands,
  validateAgentType,
  validateReportFileName,
  validateStatusTransition,
  validatePhaseOrder,
  validateQuest,
} from './validators';
import { createQuest, QuestTask, QuestStatus, PhaseType } from '../models/quest';

describe('validators', () => {
  describe('validateQuestId', () => {
    it('should accept valid quest ID', () => {
      const result = validateQuestId('add-authentication');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty quest ID', () => {
      const result = validateQuestId('');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Quest ID cannot be empty');
    });

    it('should reject quest ID longer than 50 characters', () => {
      const longId = 'a'.repeat(51);
      const result = validateQuestId(longId);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Quest ID cannot be longer than 50 characters');
    });

    it('should reject quest ID with uppercase letters', () => {
      const result = validateQuestId('Add-Authentication');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Quest ID can only contain lowercase letters, numbers, and hyphens',
      );
    });

    it('should reject quest ID starting with hyphen', () => {
      const result = validateQuestId('-add-auth');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Quest ID cannot start or end with a hyphen');
    });

    it('should reject quest ID with consecutive hyphens', () => {
      const result = validateQuestId('add--auth');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Quest ID cannot contain consecutive hyphens');
    });
  });

  describe('validateQuestFolder', () => {
    it('should accept valid quest folder', () => {
      const result = validateQuestFolder('001-add-authentication');
      expect(result.valid).toBe(true);
    });

    it('should reject folder without number prefix', () => {
      const result = validateQuestFolder('add-authentication');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Quest folder must match pattern: 001-quest-name');
    });

    it('should reject folder with wrong number format', () => {
      const result = validateQuestFolder('1-add-auth');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateQuestTitle', () => {
    it('should accept valid quest title', () => {
      const result = validateQuestTitle('Add User Authentication');
      expect(result.valid).toBe(true);
      expect(result.warnings).toBeUndefined();
    });

    it('should reject empty title', () => {
      const result = validateQuestTitle('');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Quest title cannot be empty');
    });

    it('should reject title too short', () => {
      const result = validateQuestTitle('AB');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Quest title must be at least 3 characters long');
    });

    it('should reject title too long', () => {
      const longTitle = 'A'.repeat(101);
      const result = validateQuestTitle(longTitle);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Quest title cannot be longer than 100 characters');
    });

    it('should warn about title with only special characters', () => {
      const result = validateQuestTitle('!!!###$$$');
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain(
        'Quest title contains only special characters, which may generate a poor ID',
      );
    });
  });

  describe('validateTaskDependencies', () => {
    it('should accept valid dependencies', () => {
      const tasks: QuestTask[] = [
        {
          id: 'task1',
          name: 'Task1',
          type: 'implementation',
          description: 'First task',
          dependencies: [],
          filesToCreate: [],
          filesToEdit: [],
          status: 'pending',
        },
        {
          id: 'task2',
          name: 'Task2',
          type: 'implementation',
          description: 'Second task',
          dependencies: ['task1'],
          filesToCreate: [],
          filesToEdit: [],
          status: 'pending',
        },
      ];

      const result = validateTaskDependencies(tasks);
      expect(result.valid).toBe(true);
    });

    it('should reject non-existent dependency', () => {
      const tasks: QuestTask[] = [
        {
          id: 'task1',
          name: 'Task1',
          type: 'implementation',
          description: 'First task',
          dependencies: ['non-existent'],
          filesToCreate: [],
          filesToEdit: [],
          status: 'pending',
        },
      ];

      const result = validateTaskDependencies(tasks);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Task "task1" depends on non-existent task "non-existent"');
    });

    it('should reject self-dependency', () => {
      const tasks: QuestTask[] = [
        {
          id: 'task1',
          name: 'Task1',
          type: 'implementation',
          description: 'First task',
          dependencies: ['task1'],
          filesToCreate: [],
          filesToEdit: [],
          status: 'pending',
        },
      ];

      const result = validateTaskDependencies(tasks);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Task "task1" cannot depend on itself');
    });

    it('should detect circular dependencies', () => {
      const tasks: QuestTask[] = [
        {
          id: 'task1',
          name: 'Task1',
          type: 'implementation',
          description: 'First task',
          dependencies: ['task2'],
          filesToCreate: [],
          filesToEdit: [],
          status: 'pending',
        },
        {
          id: 'task2',
          name: 'Task2',
          type: 'implementation',
          description: 'Second task',
          dependencies: ['task3'],
          filesToCreate: [],
          filesToEdit: [],
          status: 'pending',
        },
        {
          id: 'task3',
          name: 'Task3',
          type: 'implementation',
          description: 'Third task',
          dependencies: ['task1'],
          filesToCreate: [],
          filesToEdit: [],
          status: 'pending',
        },
      ];

      const result = validateTaskDependencies(tasks);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Circular dependency detected'))).toBe(true);
    });
  });

  describe('validateTaskId', () => {
    it('should accept valid task ID', () => {
      const result = validateTaskId('create-auth-service');
      expect(result.valid).toBe(true);
    });

    it('should reject empty task ID', () => {
      const result = validateTaskId('');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Task ID cannot be empty');
    });

    it('should reject task ID with special characters', () => {
      const result = validateTaskId('create_auth_service');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Task ID can only contain lowercase letters, numbers, and hyphens',
      );
    });
  });

  describe('validateTaskFiles', () => {
    it('should accept valid file lists', () => {
      const task: QuestTask = {
        id: 'task1',
        name: 'Task1',
        type: 'implementation',
        description: 'Test task',
        dependencies: [],
        filesToCreate: ['src/auth.ts'],
        filesToEdit: ['src/app.ts'],
        status: 'pending',
      };

      const result = validateTaskFiles(task);
      expect(result.valid).toBe(true);
    });

    it('should warn about implementation task with no files', () => {
      const task: QuestTask = {
        id: 'task1',
        name: 'Task1',
        type: 'implementation',
        description: 'Test task',
        dependencies: [],
        filesToCreate: [],
        filesToEdit: [],
        status: 'pending',
      };

      const result = validateTaskFiles(task);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain(
        'Implementation task "task1" has no files to create or edit',
      );
    });

    it('should reject duplicate files', () => {
      const task: QuestTask = {
        id: 'task1',
        name: 'Task1',
        type: 'implementation',
        description: 'Test task',
        dependencies: [],
        filesToCreate: ['src/auth.ts', 'src/auth.ts'],
        filesToEdit: [],
        status: 'pending',
      };

      const result = validateTaskFiles(task);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Task "task1" has duplicate file entries');
    });

    it('should reject file in both create and edit lists', () => {
      const task: QuestTask = {
        id: 'task1',
        name: 'Task1',
        type: 'implementation',
        description: 'Test task',
        dependencies: [],
        filesToCreate: ['src/auth.ts'],
        filesToEdit: ['src/auth.ts'],
        status: 'pending',
      };

      const result = validateTaskFiles(task);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Task "task1" cannot both create and edit file "src/auth.ts"',
      );
    });

    it('should warn about absolute paths', () => {
      const task: QuestTask = {
        id: 'task1',
        name: 'Task1',
        type: 'implementation',
        description: 'Test task',
        dependencies: [],
        filesToCreate: ['/src/auth.ts'],
        filesToEdit: [],
        status: 'pending',
      };

      const result = validateTaskFiles(task);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain(
        'Task "task1" has absolute file path "/src/auth.ts" - use relative paths',
      );
    });

    it('should reject parent directory references', () => {
      const task: QuestTask = {
        id: 'task1',
        name: 'Task1',
        type: 'implementation',
        description: 'Test task',
        dependencies: [],
        filesToCreate: ['../outside/file.ts'],
        filesToEdit: [],
        status: 'pending',
      };

      const result = validateTaskFiles(task);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Task "task1" has file path "../outside/file.ts" with parent directory reference',
      );
    });
  });

  describe('validateWardCommands', () => {
    it('should accept valid ward commands', () => {
      const commands = {
        all: 'npm run validate',
        lint: 'npm run lint',
        typecheck: 'npm run typecheck',
      };

      const result = validateWardCommands(commands);
      expect(result.valid).toBe(true);
    });

    it('should warn about no commands', () => {
      const result = validateWardCommands({});
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('No ward commands defined - validation will be skipped');
    });

    it('should reject empty command string', () => {
      const commands = {
        all: '   ',
      };

      const result = validateWardCommands(commands);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Ward command "all" cannot be empty');
    });

    it('should warn about missing all command', () => {
      const commands = {
        lint: 'npm run lint',
        typecheck: 'npm run typecheck',
      };

      const result = validateWardCommands(commands);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain(
        'Individual ward commands defined but no "all" command - commands will be combined with &&',
      );
    });
  });

  describe('validateAgentType', () => {
    it('should accept valid agent types', () => {
      const validTypes = [
        'voidpoker',
        'pathseeker',
        'codeweaver',
        'siegemaster',
        'lawbringer',
        'spiritmender',
      ];

      for (const type of validTypes) {
        const result = validateAgentType(type);
        expect(result.valid).toBe(true);
      }
    });

    it('should reject invalid agent type', () => {
      const result = validateAgentType('wizard');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('"wizard" is not a valid agent type');
    });

    it('should reject empty agent type', () => {
      const result = validateAgentType('');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Agent type cannot be empty');
    });
  });

  describe('validateReportFileName', () => {
    it('should accept valid report file name', () => {
      const result = validateReportFileName('001-pathseeker-report.json');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid format', () => {
      const result = validateReportFileName('pathseeker-report.json');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Report file must match pattern: 001-agenttype-report.json');
    });

    it('should reject non-JSON extension', () => {
      const result = validateReportFileName('001-pathseeker-report.txt');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateStatusTransition', () => {
    it('should accept valid transitions', () => {
      const validTransitions = [
        { from: 'in_progress', to: 'complete' },
        { from: 'in_progress', to: 'blocked' },
        { from: 'in_progress', to: 'abandoned' },
        { from: 'blocked', to: 'in_progress' },
        { from: 'blocked', to: 'abandoned' },
      ];

      for (const { from, to } of validTransitions) {
        const result = validateStatusTransition(from as QuestStatus, to as QuestStatus);
        expect(result.valid).toBe(true);
      }
    });

    it('should reject invalid transitions', () => {
      const invalidTransitions = [
        { from: 'complete', to: 'in_progress' },
        { from: 'abandoned', to: 'complete' },
        { from: 'blocked', to: 'complete' },
      ];

      for (const { from, to } of invalidTransitions) {
        const result = validateStatusTransition(from as QuestStatus, to as QuestStatus);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(`Cannot transition from "${from}" to "${to}"`);
      }
    });
  });

  describe('validatePhaseOrder', () => {
    it('should accept valid phase order', () => {
      const result = validatePhaseOrder(['discovery', 'implementation', 'testing', 'review']);
      expect(result.valid).toBe(true);
    });

    it('should accept partial phase order', () => {
      const result = validatePhaseOrder(['discovery', 'testing']);
      expect(result.valid).toBe(true);
    });

    it('should reject out of order phases', () => {
      const result = validatePhaseOrder(['implementation', 'discovery']);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Phase "discovery" is out of order');
    });

    it('should reject invalid phase', () => {
      const result = validatePhaseOrder(['discovery', 'coding'] as PhaseType[]);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('"coding" is not a valid phase');
    });
  });

  describe('validateQuest', () => {
    it('should accept valid quest', () => {
      const quest = createQuest('add-auth', '001-add-auth', 'Add Authentication');
      quest.tasks = [
        {
          id: 'create-service',
          name: 'CreateService',
          type: 'implementation',
          description: 'Create auth service',
          dependencies: [],
          filesToCreate: ['src/auth.ts'],
          filesToEdit: [],
          status: 'pending',
        } as QuestTask,
      ];

      const result = validateQuest(quest);
      expect(result.valid).toBe(true);
    });

    it('should collect all validation errors', () => {
      const quest = createQuest('', '001', ''); // Multiple invalid fields

      const result = validateQuest(quest);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it('should validate task dependencies', () => {
      const quest = createQuest('test', '001-test', 'Test');
      quest.tasks = [
        {
          id: 'task1',
          name: 'Task1',
          type: 'implementation',
          description: 'Test',
          dependencies: ['non-existent'],
          filesToCreate: [],
          filesToEdit: [],
          status: 'pending',
        } as QuestTask,
      ];

      const result = validateQuest(quest);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('non-existent'))).toBe(true);
    });

    it('should warn about timestamp inconsistencies', () => {
      const quest = createQuest('test', '001-test', 'Test');
      quest.completedAt = new Date().toISOString();
      quest.status = 'in_progress' as QuestStatus; // Inconsistent

      const result = validateQuest(quest);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain(
        'Quest has completedAt timestamp but status is not "complete"',
      );
    });
  });
});
