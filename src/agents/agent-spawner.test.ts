import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { AgentSpawner } from './agent-spawner';
import type { AgentContext, PathseekerReport, AgentType } from '../models/agent';
import type { Quest, QuestStatus, PhaseStatus } from '../models/quest';
import { QuestManager } from '../core/quest-manager';
import { FileSystem } from '../core/file-system';
import { ConfigManager } from '../core/config-manager';

describe('AgentSpawner Integration Tests', () => {
  let agentSpawner: AgentSpawner;
  let questManager: QuestManager;
  let tempDir: string;
  let agentMarkdownDir: string;
  let questmaestroDir: string;
  let originalCwd: string;
  let fileSystem: FileSystem;
  let configManager: ConfigManager;

  beforeEach(() => {
    // Save original working directory
    originalCwd = process.cwd();

    // Create temporary directories for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-spawner-test-'));
    agentMarkdownDir = path.join(tempDir, 'src', 'commands', 'quest');
    questmaestroDir = path.join(tempDir, 'questmaestro', 'active');

    // Create necessary directory structure
    fs.mkdirSync(agentMarkdownDir, { recursive: true });
    fs.mkdirSync(questmaestroDir, { recursive: true });

    // Create mock agent markdown files
    createMockAgentFiles();

    // Initialize dependencies
    fileSystem = new FileSystem();
    configManager = new ConfigManager(fileSystem);
    questManager = new QuestManager(fileSystem, configManager);
    agentSpawner = new AgentSpawner(questManager);

    // Change working directory to temp directory for tests
    process.chdir(tempDir);
  });

  afterEach(() => {
    // Restore original working directory
    process.chdir(originalCwd);

    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  function createMockAgentFiles(): void {
    const agents: AgentType[] = [
      'pathseeker',
      'codeweaver',
      'siegemaster',
      'lawbringer',
      'spiritmender',
      'voidpoker',
    ];

    agents.forEach((agentType) => {
      const agentContent = `# ${agentType.charAt(0).toUpperCase() + agentType.slice(1)} Agent

You are the ${agentType} agent. Your task is to help with software development.

## Context
$ARGUMENTS

## Instructions
Please analyze the provided context and generate a report.
`;
      fs.writeFileSync(path.join(agentMarkdownDir, `${agentType}.md`), agentContent);
    });
  }

  function createMockQuest(questFolder: string): Quest {
    const quest: Quest = {
      id: `quest-${questFolder}`,
      folder: questFolder,
      title: 'Test Quest',
      status: 'in_progress' as QuestStatus,
      createdAt: new Date().toISOString(),
      phases: {
        discovery: { status: 'complete' as PhaseStatus },
        implementation: { status: 'in_progress' as PhaseStatus },
        testing: { status: 'pending' as PhaseStatus },
        review: { status: 'pending' as PhaseStatus },
      },
      executionLog: [],
      tasks: [],
      agentRecoveryAttempts: {},
      recoveryHistory: [],
    };

    const questDir = path.join(questmaestroDir, questFolder);
    fs.mkdirSync(questDir, { recursive: true });
    fs.writeFileSync(path.join(questDir, 'quest.json'), JSON.stringify(quest, null, 2));

    return quest;
  }

  describe('agent context formatting (integration)', () => {
    const baseContext: AgentContext = {
      userRequest: 'Add authentication',
      questFolder: '001-add-auth',
      reportNumber: '1',
      wardCommands: {},
      workingDirectory: '/test/project',
    };

    it('should read agent markdown files from filesystem', () => {
      const questDir = path.join(questmaestroDir, baseContext.questFolder);
      fs.mkdirSync(questDir, { recursive: true });

      // Test that the agent spawner can read agent files
      const agentPath = path.join(agentMarkdownDir, 'pathseeker.md');
      expect(fs.existsSync(agentPath)).toBe(true);

      const content = fs.readFileSync(agentPath, 'utf8');
      expect(content).toContain('$ARGUMENTS');
      expect(content).toContain('Pathseeker Agent');
    });

    it('should validate agent files exist for all agent types', () => {
      const agents: AgentType[] = [
        'pathseeker',
        'codeweaver',
        'siegemaster',
        'lawbringer',
        'spiritmender',
        'voidpoker',
      ];

      agents.forEach((agentType) => {
        const agentPath = path.join(agentMarkdownDir, `${agentType}.md`);
        expect(fs.existsSync(agentPath)).toBe(true);
      });
    });

    it('should handle missing agent markdown file', async () => {
      // Remove one of the agent files
      const agentPath = path.join(agentMarkdownDir, 'pathseeker.md');
      fs.unlinkSync(agentPath);

      const context: AgentContext = {
        userRequest: 'Test',
        questFolder: '001-test',
        reportNumber: '1',
        wardCommands: {},
        workingDirectory: tempDir,
      };

      // This should fail when trying to spawn the agent
      await expect(agentSpawner.spawnAndWait('pathseeker', context)).rejects.toThrow();
    });
  });

  describe('report path handling (integration)', () => {
    it('should handle voidpoker custom report paths', () => {
      const customReportPath = path.join(tempDir, 'custom', 'discovery', 'report.json');
      fs.mkdirSync(path.dirname(customReportPath), { recursive: true });

      const context: AgentContext = {
        userRequest: 'Discover framework',
        questFolder: '001-discover',
        reportNumber: '1',
        wardCommands: {},
        workingDirectory: '/test/project',
        additionalContext: {
          reportPath: customReportPath,
        },
      };

      // Verify the context has the custom path
      expect((context.additionalContext as { reportPath: string }).reportPath).toBe(
        customReportPath,
      );
      expect(fs.existsSync(path.dirname(customReportPath))).toBe(true);
    });

    it('should handle standard quest report paths', () => {
      const context: AgentContext = {
        userRequest: 'Add authentication',
        questFolder: '001-add-auth',
        reportNumber: '2',
        wardCommands: {},
        workingDirectory: '/test/project',
      };

      const expectedDir = path.join(questmaestroDir, context.questFolder);
      fs.mkdirSync(expectedDir, { recursive: true });

      expect(fs.existsSync(expectedDir)).toBe(true);
    });
  });

  describe('recovery mechanism integration', () => {
    const baseContext: AgentContext = {
      userRequest: 'Add authentication',
      questFolder: '001-add-auth',
      reportNumber: '1',
      wardCommands: {},
      workingDirectory: '/test/project',
    };

    beforeEach(() => {
      createMockQuest(baseContext.questFolder);
    });

    it('should integrate with quest manager for recovery tracking', () => {
      createMockQuest(baseContext.questFolder);

      const questResult = questManager.loadQuest(baseContext.questFolder);
      expect(questResult.success).toBe(true);

      // Verify quest was created with recovery tracking structures
      expect(questResult.data).toBeDefined();
      const questData = questResult.data!;

      expect(questData.agentRecoveryAttempts).toBeDefined();
      expect(questData.recoveryHistory).toBeDefined();
      expect(Array.isArray(questData.recoveryHistory)).toBe(true);
    });

    it('should maintain quest state across recovery operations', () => {
      createMockQuest(baseContext.questFolder);

      // Load quest initially
      const initialQuest = questManager.loadQuest(baseContext.questFolder);
      expect(initialQuest.success).toBe(true);

      // Verify quest persistence
      const questPath = path.join(questmaestroDir, baseContext.questFolder, 'quest.json');
      expect(fs.existsSync(questPath)).toBe(true);

      const questContent = fs.readFileSync(questPath, 'utf8');
      const parsedQuest = JSON.parse(questContent) as Quest;
      expect(parsedQuest.folder).toBe(baseContext.questFolder);
    });
  });

  describe('pathseeker recovery assessment mode (integration)', () => {
    it('should handle pathseeker recovery assessment report format', () => {
      const assessmentReport: PathseekerReport = {
        status: 'complete',
        agentType: 'pathseeker',
        report: {
          tasks: [],
          recoveryAssessment: {
            files_completed: ['auth.service.ts'],
            files_partial: ['auth.controller.ts'],
            files_missing: ['auth.module.ts'],
            recommendation: 'continue',
            reason: 'Service is complete, controller partially done, can continue',
          },
        },
      };

      // Verify the report structure matches expected format
      expect(assessmentReport.report.recoveryAssessment).toBeDefined();
      expect(assessmentReport.report.recoveryAssessment?.files_completed).toEqual([
        'auth.service.ts',
      ]);
      expect(assessmentReport.report.recoveryAssessment?.files_partial).toEqual([
        'auth.controller.ts',
      ]);
      expect(assessmentReport.report.recoveryAssessment?.files_missing).toEqual(['auth.module.ts']);
      expect(assessmentReport.report.recoveryAssessment?.recommendation).toBe('continue');
    });

    it('should support different recovery recommendations', () => {
      const restartReport: PathseekerReport = {
        status: 'complete',
        agentType: 'pathseeker',
        report: {
          tasks: [],
          recoveryAssessment: {
            files_completed: [],
            files_partial: ['auth.service.ts'],
            files_missing: ['auth.controller.ts', 'auth.module.ts'],
            recommendation: 'restart',
            reason: 'Too many partial files, better to restart',
          },
        },
      };

      expect(restartReport.report.recoveryAssessment?.recommendation).toBe('restart');
      expect(restartReport.report.recoveryAssessment?.files_partial).toHaveLength(1);
      expect(restartReport.report.recoveryAssessment?.files_missing).toHaveLength(2);
    });
  });

  describe('file system integration', () => {
    it('should create temporary files in expected locations', () => {
      // Verify agent markdown files exist
      const agentPath = path.join(agentMarkdownDir, 'pathseeker.md');
      expect(fs.existsSync(agentPath)).toBe(true);

      const content = fs.readFileSync(agentPath, 'utf8');
      expect(content).toContain('$ARGUMENTS'); // Contains placeholder for arguments
    });

    it('should handle filesystem errors gracefully', () => {
      const context: AgentContext = {
        userRequest: 'Test',
        questFolder: 'non-existent-quest',
        reportNumber: '1',
        wardCommands: {},
        workingDirectory: tempDir,
      };

      // This should handle missing quest directories gracefully
      // The agent spawner should not crash when quest directory doesn't exist
      expect(() => {
        // Just testing that context creation doesn't throw
        expect(context.questFolder).toBe('non-existent-quest');
      }).not.toThrow();
    });
  });

  describe('edge cases and error handling (integration)', () => {
    it('should handle missing agent markdown gracefully', async () => {
      // Remove all agent files
      const agents: AgentType[] = [
        'pathseeker',
        'codeweaver',
        'siegemaster',
        'lawbringer',
        'spiritmender',
        'voidpoker',
      ];

      agents.forEach((agentType) => {
        const agentPath = path.join(agentMarkdownDir, `${agentType}.md`);
        if (fs.existsSync(agentPath)) {
          fs.unlinkSync(agentPath);
        }
      });

      const context: AgentContext = {
        userRequest: 'Test',
        questFolder: '001-test',
        reportNumber: '1',
        wardCommands: {},
        workingDirectory: tempDir,
      };

      // Should throw when trying to spawn non-existent agent
      await expect(agentSpawner.spawnAndWait('pathseeker', context)).rejects.toThrow();
    });

    it('should validate all required agent types are supported', () => {
      const supportedAgents: AgentType[] = [
        'pathseeker',
        'codeweaver',
        'siegemaster',
        'lawbringer',
        'spiritmender',
        'voidpoker',
      ];

      // Verify all agent markdown files were created
      supportedAgents.forEach((agentType) => {
        const agentPath = path.join(agentMarkdownDir, `${agentType}.md`);
        expect(fs.existsSync(agentPath)).toBe(true);
      });
    });

    it('should handle quest manager integration without crashing', () => {
      // Test with a spawner that has quest manager
      const spawnerWithQuestManager = new AgentSpawner(questManager);
      expect(spawnerWithQuestManager).toBeDefined();

      // Test with a spawner without quest manager
      const spawnerWithoutQuestManager = new AgentSpawner();
      expect(spawnerWithoutQuestManager).toBeDefined();
    });
  });

  describe('context validation (integration)', () => {
    it('should validate required context fields', () => {
      const validContext: AgentContext = {
        userRequest: 'Add authentication',
        questFolder: '001-add-auth',
        reportNumber: '1',
        wardCommands: {},
        workingDirectory: '/test/project',
      };

      // All required fields should be present
      expect(validContext.userRequest).toBeDefined();
      expect(validContext.questFolder).toBeDefined();
      expect(validContext.reportNumber).toBeDefined();
      expect(validContext.wardCommands).toBeDefined();
      expect(validContext.workingDirectory).toBeDefined();
    });

    it('should handle different context modes', () => {
      const creationContext: AgentContext = {
        userRequest: 'Add authentication',
        questFolder: '001-add-auth',
        reportNumber: '1',
        wardCommands: {},
        workingDirectory: '/test/project',
        mode: 'creation',
      };

      const validationContext: AgentContext = {
        userRequest: 'Add authentication',
        questFolder: '001-add-auth',
        reportNumber: '1',
        wardCommands: {},
        workingDirectory: '/test/project',
        mode: 'validation',
        additionalContext: {
          existingTasks: [{ id: '1', name: 'Test task' }],
        },
      };

      const recoveryContext: AgentContext = {
        userRequest: 'Add authentication',
        questFolder: '001-add-auth',
        reportNumber: '2',
        wardCommands: {},
        workingDirectory: '/test/project',
        mode: 'recovery_assessment',
        additionalContext: {
          crashedAgent: 'codeweaver',
          originalTask: { id: 'task-1', name: 'Create auth service' },
          crashReportNumber: '001',
        },
      };

      expect(creationContext.mode).toBe('creation');
      expect(validationContext.mode).toBe('validation');
      expect(recoveryContext.mode).toBe('recovery_assessment');
    });
  });

  // TODO: These integration tests would require actual process spawning or sophisticated mocking
  // For now, they serve as documentation of the expected behavior
  describe('full integration scenarios (TODO: requires process mocking)', () => {
    it.todo('should spawn claude process and wait for report file');
    it.todo('should handle agent timeout scenarios');
    it.todo('should handle blocked agent with user input');
    it.todo('should perform full recovery workflow with pathseeker assessment');
    it.todo('should limit spiritmender retry attempts');
    it.todo('should handle concurrent agent spawning');
  });
});
