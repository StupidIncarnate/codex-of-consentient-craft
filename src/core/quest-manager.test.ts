import { QuestManager } from './quest-manager';
import { FileSystem } from './file-system';
import { ConfigManager } from './config-manager';
import { createQuest } from '../models/quest';
import { PathseekerTask } from '../models/agent';
import { DEFAULT_CONFIG } from '../models/config';

// Mock dependencies
jest.mock('./file-system');
jest.mock('./config-manager');

describe('QuestManager', () => {
  let questManager: QuestManager;
  let mockFileSystem: jest.Mocked<FileSystem>;
  let mockConfigManager: jest.Mocked<ConfigManager>;

  beforeEach(() => {
    // Create mock instances
    mockFileSystem = {
      getFolderStructure: jest.fn(),
      getNextQuestNumber: jest.fn(),
      createQuestFolder: jest.fn(),
      writeJson: jest.fn(),
      readJson: jest.fn(),
      listQuests: jest.fn(),
      questExists: jest.fn(),
      moveQuest: jest.fn(),
      findQuest: jest.fn(),
      readFile: jest.fn(),
      writeFile: jest.fn(),
      fileExists: jest.fn(),
      initializeFolderStructure: jest.fn(),
    } as unknown as jest.Mocked<FileSystem>;

    mockConfigManager = {
      loadConfig: jest.fn(),
    } as unknown as jest.Mocked<ConfigManager>;

    questManager = new QuestManager(mockFileSystem, mockConfigManager);

    // Setup default mocks
    mockConfigManager.loadConfig.mockReturnValue(DEFAULT_CONFIG);
    mockFileSystem.getFolderStructure.mockReturnValue({
      root: '/test/questmaestro',
      active: '/test/questmaestro/active',
      completed: '/test/questmaestro/completed',
      abandoned: '/test/questmaestro/abandoned',
      retros: '/test/questmaestro/retros',
      lore: '/test/questmaestro/lore',
      discovery: '/test/questmaestro/discovery',
    });
  });

  describe('createNewQuest', () => {
    it('should create a new quest successfully', () => {
      mockFileSystem.getNextQuestNumber.mockReturnValue({
        success: true,
        data: '001',
      });
      mockFileSystem.createQuestFolder.mockReturnValue({
        success: true,
        data: '/test/questmaestro/active/001-add-auth',
      });
      mockFileSystem.writeJson.mockReturnValue({ success: true });
      mockFileSystem.listQuests.mockReturnValue({
        success: true,
        data: [],
      });

      const result = questManager.createNewQuest(
        'Add Authentication',
        'Please add JWT authentication',
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe('add-authentication');
      expect(result.data?.folder).toBe('001-add-authentication');
      expect(result.data?.title).toBe('Add Authentication');
      expect(result.data?.userRequest).toBe('Please add JWT authentication');
      expect(result.data?.status).toBe('in_progress');
    });

    it('should handle quest number generation failure', () => {
      mockFileSystem.getNextQuestNumber.mockReturnValue({
        success: false,
        error: 'Failed to read directory',
      });

      const result = questManager.createNewQuest('Test Quest', 'Test request');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to generate quest number');
    });

    it('should handle folder creation failure', () => {
      mockFileSystem.getNextQuestNumber.mockReturnValue({
        success: true,
        data: '001',
      });
      mockFileSystem.createQuestFolder.mockReturnValue({
        success: false,
        error: 'Permission denied',
      });

      const result = questManager.createNewQuest('Test Quest', 'Test request');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission denied');
    });

    it('should sanitize quest ID from title', () => {
      mockFileSystem.getNextQuestNumber.mockReturnValue({
        success: true,
        data: '001',
      });
      mockFileSystem.createQuestFolder.mockReturnValue({
        success: true,
        data: '/test/path',
      });
      mockFileSystem.writeJson.mockReturnValue({ success: true });
      mockFileSystem.listQuests.mockReturnValue({
        success: true,
        data: [],
      });

      const result = questManager.createNewQuest(
        'Add JWT Authentication & OAuth2.0 Support!!!',
        'Test',
      );

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('add-jwt-authentication-oauth2-0-support');
    });
  });

  describe('loadQuest', () => {
    it('should load quest successfully', () => {
      const mockQuest = createQuest('test', '001-test', 'Test Quest');

      mockFileSystem.readJson.mockReturnValue({
        success: true,
        data: mockQuest,
      });

      const result = questManager.loadQuest('001-test');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockQuest);
      expect(mockFileSystem.readJson).toHaveBeenCalledWith(
        '/test/questmaestro/active/001-test/quest.json',
      );
    });

    it('should handle quest not found', () => {
      mockFileSystem.readJson.mockReturnValue({
        success: false,
        error: 'File not found',
      });

      const result = questManager.loadQuest('001-test');

      expect(result.success).toBe(false);
      expect(result.error).toContain('File not found');
    });
  });

  describe('saveQuest', () => {
    it('should save quest and update tracker', () => {
      const quest = createQuest('test', '001-test', 'Test Quest');

      mockFileSystem.writeJson.mockReturnValue({ success: true });
      mockFileSystem.listQuests.mockReturnValue({
        success: true,
        data: ['001-test'],
      });
      mockFileSystem.readJson.mockReturnValue({
        success: true,
        data: quest,
      });

      const result = questManager.saveQuest(quest);

      expect(result).toBe(true);
      expect(quest.updatedAt).toBeDefined();
      expect(mockFileSystem.writeJson).toHaveBeenCalledWith(
        '/test/questmaestro/active/001-test/quest.json',
        expect.objectContaining({
          id: 'test',
          updatedAt: expect.any(String),
        }),
      );
    });

    it('should handle save failure', () => {
      const quest = createQuest('test', '001-test', 'Test Quest');

      mockFileSystem.writeJson.mockReturnValue({
        success: false,
        error: 'Disk full',
      });

      const result = questManager.saveQuest(quest);

      expect(result).toBe(false);
    });
  });

  describe('updateQuestStatus', () => {
    it('should update quest status to complete', () => {
      const quest = createQuest('test', '001-test', 'Test Quest');

      mockFileSystem.readJson.mockReturnValue({
        success: true,
        data: quest,
      });
      mockFileSystem.writeJson.mockReturnValue({ success: true });
      mockFileSystem.listQuests.mockReturnValue({
        success: true,
        data: [],
      });

      const result = questManager.updateQuestStatus('001-test', 'complete');

      expect(result).toBe(true);
      expect(mockFileSystem.writeJson).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          status: 'complete',
          completedAt: expect.any(String),
        }),
      );
    });

    it('should handle quest not found', () => {
      mockFileSystem.readJson.mockReturnValue({
        success: false,
        error: 'Not found',
      });

      const result = questManager.updateQuestStatus('001-test', 'complete');

      expect(result).toBe(false);
    });
  });

  describe('addTasks', () => {
    it('should add tasks to quest', () => {
      const quest = createQuest('test', '001-test', 'Test Quest');
      const tasks: PathseekerTask[] = [
        {
          id: 'task1',
          name: 'Task1',
          type: 'implementation',
          description: 'First task',
          dependencies: [],
          filesToCreate: ['file1.ts'],
          filesToEdit: [],
        },
        {
          id: 'task2',
          name: 'Task2',
          type: 'implementation',
          description: 'Second task',
          dependencies: ['task1'],
          filesToCreate: ['file2.ts'],
          filesToEdit: [],
        },
      ];

      mockFileSystem.readJson.mockReturnValue({
        success: true,
        data: quest,
      });
      mockFileSystem.writeJson.mockReturnValue({ success: true });
      mockFileSystem.listQuests.mockReturnValue({
        success: true,
        data: [],
      });

      const result = questManager.addTasks('001-test', tasks);

      expect(result).toBe(true);
      expect(mockFileSystem.writeJson).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          tasks: expect.arrayContaining([
            expect.objectContaining({
              id: 'task1',
              status: 'pending',
            }),
            expect.objectContaining({
              id: 'task2',
              status: 'pending',
            }),
          ]),
        }),
      );
    });

    it('should reject tasks with invalid dependencies', () => {
      const quest = createQuest('test', '001-test', 'Test Quest');
      const tasks: PathseekerTask[] = [
        {
          id: 'task1',
          name: 'Task1',
          type: 'implementation',
          description: 'First task',
          dependencies: ['non-existent'],
          filesToCreate: [],
          filesToEdit: [],
        },
      ];

      mockFileSystem.readJson.mockReturnValue({
        success: true,
        data: quest,
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = questManager.addTasks('001-test', tasks);

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('depends on non-existent task'),
      );

      consoleErrorSpy.mockRestore();
    });

    it('should reject tasks with circular dependencies', () => {
      const quest = createQuest('test', '001-test', 'Test Quest');
      const tasks: PathseekerTask[] = [
        {
          id: 'task1',
          name: 'Task1',
          type: 'implementation',
          description: 'First task',
          dependencies: ['task2'],
          filesToCreate: [],
          filesToEdit: [],
        },
        {
          id: 'task2',
          name: 'Task2',
          type: 'implementation',
          description: 'Second task',
          dependencies: ['task1'],
          filesToCreate: [],
          filesToEdit: [],
        },
      ];

      mockFileSystem.readJson.mockReturnValue({
        success: true,
        data: quest,
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = questManager.addTasks('001-test', tasks);

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Circular dependency detected'),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('updateTaskStatus', () => {
    it('should update task status and timestamps', () => {
      const quest = createQuest('test', '001-test', 'Test Quest');
      quest.tasks = [
        {
          id: 'task1',
          name: 'Task1',
          type: 'implementation',
          description: 'Test task',
          dependencies: [],
          filesToCreate: [],
          filesToEdit: [],
          status: 'pending',
        },
      ];

      mockFileSystem.readJson.mockReturnValue({
        success: true,
        data: quest,
      });
      mockFileSystem.writeJson.mockReturnValue({ success: true });
      mockFileSystem.listQuests.mockReturnValue({
        success: true,
        data: [],
      });

      const result = questManager.updateTaskStatus(
        '001-test',
        'task1',
        'complete',
        '002-codeweaver-report.json',
      );

      expect(result).toBe(true);
      expect(mockFileSystem.writeJson).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          tasks: expect.arrayContaining([
            expect.objectContaining({
              id: 'task1',
              status: 'complete',
              completedAt: expect.any(String),
              completedBy: '002-codeweaver-report.json',
            }),
          ]),
        }),
      );
    });

    it('should update phase progress for implementation tasks', () => {
      const quest = createQuest('test', '001-test', 'Test Quest');
      quest.tasks = [
        {
          id: 'task1',
          name: 'Task1',
          type: 'implementation',
          description: 'Test task',
          dependencies: [],
          filesToCreate: [],
          filesToEdit: [],
          status: 'complete',
        },
        {
          id: 'task2',
          name: 'Task2',
          type: 'implementation',
          description: 'Test task 2',
          dependencies: [],
          filesToCreate: [],
          filesToEdit: [],
          status: 'pending',
        },
      ];

      mockFileSystem.readJson.mockReturnValue({
        success: true,
        data: quest,
      });
      mockFileSystem.writeJson.mockReturnValue({ success: true });
      mockFileSystem.listQuests.mockReturnValue({
        success: true,
        data: [],
      });

      const result = questManager.updateTaskStatus('001-test', 'task2', 'complete');

      expect(result).toBe(true);
      expect(mockFileSystem.writeJson).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          phases: expect.objectContaining({
            implementation: expect.objectContaining({
              progress: '2/2',
            }),
          }),
        }),
      );
    });

    it('should handle task not found', () => {
      const quest = createQuest('test', '001-test', 'Test Quest');
      quest.tasks = [];

      mockFileSystem.readJson.mockReturnValue({
        success: true,
        data: quest,
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = questManager.updateTaskStatus('001-test', 'non-existent', 'complete');

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Task non-existent not found'),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('updatePhaseStatus', () => {
    it('should update phase status with timestamps', () => {
      const quest = createQuest('test', '001-test', 'Test Quest');

      mockFileSystem.readJson.mockReturnValue({
        success: true,
        data: quest,
      });
      mockFileSystem.writeJson.mockReturnValue({ success: true });
      mockFileSystem.listQuests.mockReturnValue({
        success: true,
        data: [],
      });

      const result = questManager.updatePhaseStatus(
        '001-test',
        'discovery',
        'complete',
        '001-pathseeker-report.json',
      );

      expect(result).toBe(true);
      expect(mockFileSystem.writeJson).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          phases: expect.objectContaining({
            discovery: expect.objectContaining({
              status: 'complete',
              completedAt: expect.any(String),
              report: '001-pathseeker-report.json',
            }),
          }),
        }),
      );
    });
  });

  describe('addExecutionLogEntry', () => {
    it('should add execution log entry with timestamp', () => {
      const quest = createQuest('test', '001-test', 'Test Quest');

      mockFileSystem.readJson.mockReturnValue({
        success: true,
        data: quest,
      });
      mockFileSystem.writeJson.mockReturnValue({ success: true });
      mockFileSystem.listQuests.mockReturnValue({
        success: true,
        data: [],
      });

      const result = questManager.addExecutionLogEntry('001-test', {
        report: '001-pathseeker-report.json',
        agentType: 'pathseeker',
      });

      expect(result).toBe(true);
      expect(mockFileSystem.writeJson).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          executionLog: expect.arrayContaining([
            expect.objectContaining({
              report: '001-pathseeker-report.json',
              agentType: 'pathseeker',
              timestamp: expect.any(String),
            }),
          ]),
        }),
      );
    });
  });

  describe('getActiveQuests', () => {
    it('should return sorted active quests', () => {
      const quest1 = createQuest('test1', '001-test1', 'Test Quest 1');
      quest1.createdAt = '2024-01-01T00:00:00Z';

      const quest2 = createQuest('test2', '002-test2', 'Test Quest 2');
      quest2.createdAt = '2024-01-02T00:00:00Z';

      mockFileSystem.listQuests.mockReturnValue({
        success: true,
        data: ['001-test1', '002-test2'],
      });

      mockFileSystem.readJson
        .mockReturnValueOnce({ success: true, data: quest1 })
        .mockReturnValueOnce({ success: true, data: quest2 });

      const result = questManager.getActiveQuests();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('test2'); // Newer quest first
      expect(result[1].id).toBe('test1');
    });

    it('should handle empty quest list', () => {
      mockFileSystem.listQuests.mockReturnValue({
        success: true,
        data: [],
      });

      const result = questManager.getActiveQuests();

      expect(result).toEqual([]);
    });
  });

  describe('findQuest', () => {
    it('should find quest by search term', () => {
      const quest = createQuest('test', '001-test', 'Test Quest');

      mockFileSystem.findQuest.mockReturnValue({
        success: true,
        data: { folder: '001-test', state: 'active' },
      });
      mockFileSystem.readJson.mockReturnValue({
        success: true,
        data: quest,
      });

      const result = questManager.findQuest('test');

      expect(result.success).toBe(true);
      expect(result.data?.quest).toEqual(quest);
      expect(result.data?.state).toBe('active');
    });

    it('should handle quest not found', () => {
      mockFileSystem.findQuest.mockReturnValue({
        success: false,
        error: 'Quest "non-existent" not found',
      });

      const result = questManager.findQuest('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('moveQuest', () => {
    it('should move quest between states', () => {
      const quest = createQuest('test', '001-test', 'Test Quest');

      mockFileSystem.readJson.mockReturnValue({
        success: true,
        data: quest,
      });
      mockFileSystem.writeJson.mockReturnValue({ success: true });
      mockFileSystem.moveQuest.mockReturnValue({
        success: true,
        data: '/test/questmaestro/completed/001-test',
      });
      mockFileSystem.listQuests.mockReturnValue({
        success: true,
        data: [],
      });

      const result = questManager.moveQuest('001-test', 'active', 'completed');

      expect(result).toBe(true);
      expect(mockFileSystem.moveQuest).toHaveBeenCalledWith(
        '001-test',
        'active',
        'completed',
        undefined,
      );
    });
  });

  describe('abandonQuest', () => {
    it('should abandon quest with reason', () => {
      const quest = createQuest('test', '001-test', 'Test Quest');

      mockFileSystem.readJson.mockReturnValue({
        success: true,
        data: quest,
      });
      mockFileSystem.writeJson.mockReturnValue({ success: true });
      mockFileSystem.moveQuest.mockReturnValue({
        success: true,
        data: '/test/questmaestro/abandoned/001-test',
      });
      mockFileSystem.listQuests.mockReturnValue({
        success: true,
        data: [],
      });

      const result = questManager.abandonQuest('001-test', 'Requirements changed');

      expect(result).toBe(true);
      expect(mockFileSystem.writeJson).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          status: 'abandoned',
          abandonReason: 'Requirements changed',
        }),
      );
    });
  });

  describe('getNextTasks', () => {
    it('should return tasks with completed dependencies', () => {
      const quest = createQuest('test', '001-test', 'Test Quest');
      quest.tasks = [
        {
          id: 'task1',
          name: 'Task1',
          type: 'implementation',
          description: 'First task',
          dependencies: [],
          filesToCreate: [],
          filesToEdit: [],
          status: 'complete',
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
        {
          id: 'task3',
          name: 'Task3',
          type: 'implementation',
          description: 'Third task',
          dependencies: ['task2'],
          filesToCreate: [],
          filesToEdit: [],
          status: 'pending',
        },
      ];

      mockFileSystem.readJson.mockReturnValue({
        success: true,
        data: quest,
      });

      const result = questManager.getNextTasks('001-test');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('task2');
    });

    it('should handle tasks with skipped dependencies', () => {
      const quest = createQuest('test', '001-test', 'Test Quest');
      quest.tasks = [
        {
          id: 'task1',
          name: 'Task1',
          type: 'implementation',
          description: 'First task',
          dependencies: [],
          filesToCreate: [],
          filesToEdit: [],
          status: 'skipped',
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

      mockFileSystem.readJson.mockReturnValue({
        success: true,
        data: quest,
      });

      const result = questManager.getNextTasks('001-test');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('task2');
    });
  });

  describe('checkPhaseCompletion', () => {
    it('should check if quest can proceed to next phase', () => {
      const quest = createQuest('test', '001-test', 'Test Quest');
      quest.phases.discovery.status = 'complete';
      quest.tasks = [
        {
          id: 'task1',
          name: 'Task1',
          type: 'implementation',
          description: 'Task',
          dependencies: [],
          filesToCreate: [],
          filesToEdit: [],
          status: 'complete',
        },
      ];

      mockFileSystem.readJson.mockReturnValue({
        success: true,
        data: quest,
      });

      const result = questManager.checkPhaseCompletion('001-test');

      expect(result.canProceed).toBe(true);
      expect(result.currentPhase).toBe('implementation');
      expect(result.nextPhase).toBe('testing');
    });

    it('should handle quest not found', () => {
      mockFileSystem.readJson.mockReturnValue({
        success: false,
        error: 'Not found',
      });

      const result = questManager.checkPhaseCompletion('001-test');

      expect(result.canProceed).toBe(false);
      expect(result.currentPhase).toBeNull();
      expect(result.nextPhase).toBeNull();
    });
  });
});
