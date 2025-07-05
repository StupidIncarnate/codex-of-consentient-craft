import * as fs from 'fs/promises';
import * as path from 'path';
import { QuestStateBuilder } from '../utils/quest-state-builder';
import {
  QuestStatus,
  PhaseStatus,
  ComponentStatus
} from '../utils/quest-state-machine';
import { TestProject, createTestProject } from '../utils/testbed';

describe('Quest State Builder', () => {
  let testProject: TestProject;
  let builder: QuestStateBuilder;

  beforeEach(async () => {
    testProject = await createTestProject('state-builder-test');
    builder = new QuestStateBuilder(testProject.rootDir, 'Test Quest');
  });

  afterEach(async () => {
    // Cleanup
    await fs.rm(testProject.rootDir, { recursive: true, force: true });
  });

  describe('constructor', () => {
    test('should create builder with quest title', () => {
      const quest = builder.getQuest();
      expect(quest.title).toBe('Test Quest');
      expect(quest.id).toContain('test-quest-');
      expect(quest.status).toBe(QuestStatus.ACTIVE);
    });

    test('should accept custom quest id', () => {
      const customBuilder = new QuestStateBuilder(testProject.rootDir, 'Custom Quest', 'custom-id-123');
      const quest = customBuilder.getQuest();
      expect(quest.id).toBe('custom-id-123');
    });

    test('should initialize with empty phases', () => {
      const quest = builder.getQuest();
      expect(quest.phases.discovery.status).toBe(PhaseStatus.NOT_STARTED);
      expect(quest.phases.implementation.status).toBe(PhaseStatus.NOT_STARTED);
      expect(quest.phases.review.status).toBe(PhaseStatus.NOT_STARTED);
      expect(quest.phases.testing.status).toBe(PhaseStatus.NOT_STARTED);
    });
  });

  describe('inTaskweaverState', () => {
    test('should set quest to active state', () => {
      builder.inTaskweaverState();
      const quest = builder.getQuest();
      
      expect(quest.status).toBe(QuestStatus.ACTIVE);
      expect(quest.complexity).toBe('medium');
      expect(quest.tags).toEqual(['test', 'automated']);
      expect(quest.agentReports.pathseeker).toBeDefined();
      expect(quest.agentReports.pathseeker!.length).toBeGreaterThan(0);
      expect(quest.agentReports.pathseeker![0].agentId).toMatch(/pathseeker-\d+/);
    });

    test('should handle blocked status with blockers', () => {
      builder.inTaskweaverState(QuestStatus.BLOCKED, {
        withBlockers: true,
        errorMessage: 'Missing dependencies'
      });
      const quest = builder.getQuest();
      
      expect(quest.status).toBe(QuestStatus.BLOCKED);
      expect(quest.blockers).toHaveLength(1);
      expect(quest.blockers![0].type).toBe('missing_requirements');
      expect(quest.blockers![0].description).toBe('Missing dependencies');
    });

    test('should add activity log', () => {
      builder.inTaskweaverState();
      const quest = builder.getQuest();
      
      expect(quest.activity).toHaveLength(1);
      expect(quest.activity[0].agent).toBe('pathseeker');
      expect(quest.activity[0].action).toBe('Quest created from Pathseeker exploration');
    });

    test('should track state history', () => {
      builder.inTaskweaverState();
      expect(builder.getStateHistory()).toContain('quest_creation');
    });
  });

  describe('inPathseekerState', () => {
    test('should auto-run taskweaver if not done', () => {
      builder.inPathseekerState();
      const history = builder.getStateHistory();
      
      expect(history).toEqual(['quest_creation', 'pathseeker']);
    });

    test('should complete discovery phase', () => {
      builder.inPathseekerState(PhaseStatus.COMPLETE);
      const quest = builder.getQuest();
      
      expect(quest.phases.discovery.status).toBe(PhaseStatus.COMPLETE);
      expect(quest.phases.discovery.findings).toBeDefined();
      expect(quest.phases.discovery.findings!.components.length).toBeGreaterThan(0);
      expect(quest.phases.implementation.components.length).toBeGreaterThan(0);
      expect(quest.phases.implementation.status).toBe(PhaseStatus.NOT_STARTED);
    });

    test('should handle custom components', () => {
      const customComponents = [
        { name: 'auth', description: 'authentication service' },
        { name: 'db', description: 'database layer', dependencies: ['auth'] }
      ];
      
      builder.inPathseekerState(PhaseStatus.COMPLETE, { customComponents });
      const quest = builder.getQuest();
      
      expect(quest.phases.discovery.findings!.components).toHaveLength(2);
      expect(quest.phases.discovery.findings!.components[0].name).toContain('auth');
      expect(quest.phases.discovery.findings!.components[1].dependencies).toEqual(['auth']);
    });

    test('should handle blocked discovery', () => {
      // Create a builder without auto-running quest creation
      const freshBuilder = new QuestStateBuilder(builder['projectDir'], 'Block Test');
      // Don't call inTaskweaverState, just manually set up the minimal state
      freshBuilder.getQuest().phases.discovery.status = PhaseStatus.NOT_STARTED;
      
      // Now call pathseeker directly with blocked status
      freshBuilder.inPathseekerState(PhaseStatus.BLOCKED, {
        errorMessage: 'Cannot analyze codebase'
      });
      const quest = freshBuilder.getQuest();
      
      expect(quest.phases.discovery.status).toBe(PhaseStatus.BLOCKED);
      expect(quest.status).toBe(QuestStatus.BLOCKED);
      expect(quest.blockers).toHaveLength(1);
      expect(quest.blockers![0].type).toBe('discovery_failed');
    });

    test('should handle partial discovery', () => {
      builder.inPathseekerState(PhaseStatus.IN_PROGRESS);
      const quest = builder.getQuest();
      
      expect(quest.phases.discovery.status).toBe(PhaseStatus.IN_PROGRESS);
      expect(quest.phases.discovery.findings).toBeDefined();
      expect(quest.phases.discovery.findings!.components.length).toBeGreaterThan(0);
    });

    test('should generate appropriate components based on quest title', () => {
      const mathBuilder = new QuestStateBuilder(testProject.rootDir, 'Math Functions');
      mathBuilder.inPathseekerState(PhaseStatus.COMPLETE);
      const mathQuest = mathBuilder.getQuest();
      
      const componentNames = mathQuest.phases.implementation.components.map(c => c.name);
      expect(componentNames.some(n => n.includes('add'))).toBe(true);
      expect(componentNames.some(n => n.includes('subtract'))).toBe(true);
    });
  });

  describe('inCodeweaverState', () => {
    test('should auto-complete discovery if not done', () => {
      builder.inCodeweaverState();
      const quest = builder.getQuest();
      
      expect(quest.phases.discovery.status).toBe(PhaseStatus.COMPLETE);
      expect(quest.phases.implementation.status).toBe(PhaseStatus.COMPLETE);
    });

    test('should implement all components', () => {
      builder.inPathseekerState().inCodeweaverState(PhaseStatus.COMPLETE);
      const quest = builder.getQuest();
      const files = builder.getFiles();
      
      expect(quest.phases.implementation.status).toBe(PhaseStatus.COMPLETE);
      quest.phases.implementation.components.forEach(component => {
        expect(component.status).toBe(ComponentStatus.COMPLETE);
        expect(component.files).toBeDefined();
        expect(component.files!.length).toBe(2); // .ts and .test.ts
      });
      
      expect(files.size).toBeGreaterThan(0);
    });

    test('should handle partial implementation', () => {
      builder.inPathseekerState().inCodeweaverState(PhaseStatus.IN_PROGRESS, {
        partialOnly: true
      });
      const quest = builder.getQuest();
      
      const completedComponents = quest.phases.implementation.components.filter(
        c => c.status === ComponentStatus.COMPLETE
      );
      const queuedComponents = quest.phases.implementation.components.filter(
        c => c.status === ComponentStatus.QUEUED
      );
      
      expect(completedComponents.length).toBeGreaterThan(0);
      expect(queuedComponents.length).toBeGreaterThan(0);
    });

    test('should handle blocked implementation', () => {
      builder.inPathseekerState().inCodeweaverState(PhaseStatus.BLOCKED, {
        errorMessage: 'Type errors in component'
      });
      const quest = builder.getQuest();
      
      expect(quest.phases.implementation.status).toBe(PhaseStatus.BLOCKED);
      expect(quest.status).toBe(QuestStatus.BLOCKED);
      expect(quest.blockers).toBeDefined();
      expect(quest.blockers!.some(b => b.type === 'implementation_error')).toBe(true);
    });

    test('should generate files with errors when requested', () => {
      builder.inPathseekerState().inCodeweaverState(PhaseStatus.COMPLETE, {
        withErrors: true
      });
      const files = builder.getFiles();
      
      const hasErrorFile = Array.from(files.values()).some(content => 
        content.includes('// Error: \'c\' is not defined')
      );
      expect(hasErrorFile).toBe(true);
    });

    test('should add codeweaver reports for each component', () => {
      builder.inPathseekerState().inCodeweaverState();
      const quest = builder.getQuest();
      
      expect(quest.agentReports.codeweaver).toBeDefined();
      expect(quest.agentReports.codeweaver!.length).toBe(quest.phases.implementation.components.length);
      expect(quest.agentReports.codeweaver![0].agentId).toMatch(/codeweaver-.+-\d+/);
    });
  });

  describe('inLawbringerState', () => {
    test('should auto-implement if not done', () => {
      builder.inLawbringerState();
      const quest = builder.getQuest();
      
      expect(quest.phases.implementation.status).toBe(PhaseStatus.COMPLETE);
      expect(quest.phases.review.status).toBe(PhaseStatus.COMPLETE);
    });

    test('should complete review with no issues', () => {
      builder.inCodeweaverState().inLawbringerState(PhaseStatus.COMPLETE);
      const quest = builder.getQuest();
      
      expect(quest.phases.review.status).toBe(PhaseStatus.COMPLETE);
      expect(quest.phases.review.issues).toEqual([]);
      expect(quest.phases.review.recommendations).toBeDefined();
    });

    test('should handle review with issues', () => {
      builder.inCodeweaverState().inLawbringerState(PhaseStatus.COMPLETE, {
        withErrors: true
      });
      const quest = builder.getQuest();
      
      expect(quest.phases.review.issues!.length).toBeGreaterThan(0);
      expect(quest.phases.review.issues!.some(i => i.severity === 'major')).toBe(true);
    });

    test('should set components to need revision for major issues', () => {
      builder.inCodeweaverState();
      const quest = builder.getQuest();
      
      // Get the first component file to use in the review issue
      const firstComponentFile = quest.phases.implementation.components[0]?.files?.[0] || 'src/unknown.ts';
      
      builder.inLawbringerState(PhaseStatus.COMPLETE, {
        reviewIssues: [
          { severity: 'major' as const, file: firstComponentFile, message: 'Critical error' }
        ]
      });
      
      const updatedQuest = builder.getQuest();
      const needsRevision = updatedQuest.phases.implementation.components.some(
        c => c.status === ComponentStatus.NEEDS_REVISION
      );
      expect(needsRevision).toBe(true);
      expect(updatedQuest.phases.implementation.status).toBe(PhaseStatus.IN_PROGRESS);
    });

    test('should handle in-progress review', () => {
      builder.inCodeweaverState().inLawbringerState(PhaseStatus.IN_PROGRESS, {
        percentComplete: 75
      });
      const quest = builder.getQuest();
      
      expect(quest.phases.review.status).toBe(PhaseStatus.IN_PROGRESS);
      expect(quest.phases.review.progress).toBe('75%');
    });
  });

  describe('inSiegemasterState', () => {
    test('should auto-complete review if not done', () => {
      builder.inSiegemasterState();
      const quest = builder.getQuest();
      
      expect(quest.phases.review.status).toBe(PhaseStatus.COMPLETE);
      expect(quest.phases.testing.status).toBe(PhaseStatus.COMPLETE);
    });

    test('should complete testing phase', () => {
      builder.inLawbringerState().inSiegemasterState(PhaseStatus.COMPLETE);
      const quest = builder.getQuest();
      const files = builder.getFiles();
      
      expect(quest.phases.testing.status).toBe(PhaseStatus.COMPLETE);
      expect(quest.phases.testing.coverage).toBe('95%');
      expect(quest.phases.testing.testsCreated).toBeDefined();
      expect(quest.phases.testing.testsCreated!.length).toBeGreaterThan(0);
      
      const hasIntegrationTests = Array.from(files.keys()).some(
        path => path.includes('integration.test.ts')
      );
      expect(hasIntegrationTests).toBe(true);
    });

    test('should handle custom test coverage', () => {
      builder.inLawbringerState().inSiegemasterState(PhaseStatus.COMPLETE, {
        testCoverage: '85%'
      });
      const quest = builder.getQuest();
      
      expect(quest.phases.testing.coverage).toBe('85%');
    });

    test('should handle failing tests', () => {
      builder.inLawbringerState().inSiegemasterState(PhaseStatus.COMPLETE, {
        failingTests: ['test1', 'test2']
      });
      const quest = builder.getQuest();
      
      expect(quest.phases.testing.failedTests).toEqual(['test1', 'test2']);
    });

    test('should handle blocked testing', () => {
      builder.inLawbringerState().inSiegemasterState(PhaseStatus.BLOCKED, {
        errorMessage: 'Database connection failed'
      });
      const quest = builder.getQuest();
      
      expect(quest.phases.testing.status).toBe(PhaseStatus.BLOCKED);
      expect(quest.status).toBe(QuestStatus.BLOCKED);
      expect(quest.blockers!.some(b => b.type === 'test_failure')).toBe(true);
    });
  });

  describe('inSpiritMenderState', () => {
    test('should create blocker if none exist', () => {
      builder.inSpiritMenderState(false); // Don't resolve immediately
      const quest = builder.getQuest();
      
      expect(quest.blockers).toBeDefined();
      expect(quest.blockers!.length).toBeGreaterThan(0);
      expect(quest.agentReports.spiritmender).toBeDefined();
      expect(quest.agentReports.spiritmender!.length).toBeGreaterThan(0);
      expect(quest.agentReports.spiritmender![0].agentId).toMatch(/spiritmender-\d+/);
    });

    test('should resolve blockers', () => {
      // First implement some components
      builder.inCodeweaverState(PhaseStatus.IN_PROGRESS);
      // Then block it
      builder.inCodeweaverState(PhaseStatus.BLOCKED);
      // Then resolve with SpiritMender
      builder.inSpiritMenderState(true);
      const quest = builder.getQuest();
      
      expect(quest.blockers).toEqual([]);
      expect(quest.status).toBe(QuestStatus.ACTIVE);
      // The partially implemented components should still be complete
      const completedComponents = quest.phases.implementation.components.filter(
        c => c.status === ComponentStatus.COMPLETE
      );
      expect(completedComponents.length).toBeGreaterThan(0);
    });

    test('should handle unresolved blockers', () => {
      builder.inCodeweaverState(PhaseStatus.IN_PROGRESS)
        .inCodeweaverState(PhaseStatus.BLOCKED)
        .inSpiritMenderState(false);
      const quest = builder.getQuest();
      
      expect(quest.blockers!.length).toBeGreaterThan(0);
      expect(quest.status).toBe(QuestStatus.BLOCKED);
    });

    test('should add activity for healing', () => {
      builder.inSpiritMenderState();
      const quest = builder.getQuest();
      
      const healingActivity = quest.activity.find(a => a.agent === 'spiritmender');
      expect(healingActivity).toBeDefined();
      expect(healingActivity!.action).toContain('Healing');
    });
  });

  describe('inCompletedState', () => {
    test('should auto-complete all phases', () => {
      builder.inCompletedState();
      const quest = builder.getQuest();
      
      expect(quest.status).toBe(QuestStatus.COMPLETED);
      expect(quest.phases.discovery.status).toBe(PhaseStatus.COMPLETE);
      expect(quest.phases.implementation.status).toBe(PhaseStatus.COMPLETE);
      expect(quest.phases.review.status).toBe(PhaseStatus.COMPLETE);
      expect(quest.phases.testing.status).toBe(PhaseStatus.COMPLETE);
    });

    test('should set outcome', () => {
      builder.inCompletedState();
      const quest = builder.getQuest();
      
      expect(quest.outcome).toBeDefined();
      expect(quest.outcome!.status).toBe('success');
      expect(quest.outcome!.completedAt).toBeDefined();
      expect(quest.outcome!.summary).toContain('Successfully implemented');
    });

    test('should update tracker', () => {
      builder.inCompletedState();
      const quest = builder.getQuest();
      
      // This would be tested in prepareTestEnvironment
      expect(quest.status).toBe(QuestStatus.COMPLETED);
    });
  });

  describe('inAbandonedState', () => {
    test('should abandon quest', () => {
      builder.inAbandonedState('User canceled');
      const quest = builder.getQuest();
      
      expect(quest.status).toBe(QuestStatus.ABANDONED);
      expect(quest.outcome).toBeDefined();
      expect(quest.outcome!.status).toBe('abandoned');
      expect(quest.outcome!.reason).toBe('User canceled');
      expect(quest.outcome!.abandonedAt).toBeDefined();
    });

    test('should use default reason', () => {
      builder.inAbandonedState();
      const quest = builder.getQuest();
      
      expect(quest.outcome!.reason).toBe('User requested abandonment');
    });
  });

  describe('prepareTestEnvironment', () => {
    test('should create directory structure', async () => {
      await builder.prepareTestEnvironment();
      
      const questDir = path.join(testProject.rootDir, 'questmaestro');
      const dirs = ['active', 'completed', 'abandoned', 'retros', 'lore'];
      
      for (const dir of dirs) {
        const dirPath = path.join(questDir, dir);
        const exists = await fs.access(dirPath).then(() => true).catch(() => false);
        expect(exists).toBe(true);
      }
    });

    test('should write quest-tracker.json', async () => {
      const env = await builder.prepareTestEnvironment();
      
      const trackerContent = await fs.readFile(env.trackerPath, 'utf-8');
      const tracker = JSON.parse(trackerContent);
      
      expect(tracker.active).toContain(`${builder.getQuest().id}.json`);
      expect(tracker.completed).toEqual([]);
      expect(tracker.abandoned).toEqual([]);
    });

    test('should write quest file in correct folder', async () => {
      await builder.inCompletedState().prepareTestEnvironment();
      
      const completedPath = path.join(testProject.rootDir, 'questmaestro', 'completed', `${builder.getQuest().id}.json`);
      const exists = await fs.access(completedPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    test('should write code files', async () => {
      builder.inCodeweaverState();
      const env = await builder.prepareTestEnvironment();
      
      for (const file of env.files) {
        const filePath = path.join(testProject.rootDir, file);
        const exists = await fs.access(filePath).then(() => true).catch(() => false);
        expect(exists).toBe(true);
      }
    });

    test('should return environment info', async () => {
      builder.inCodeweaverState(PhaseStatus.IN_PROGRESS);
      const env = await builder.prepareTestEnvironment();
      
      expect(env.questId).toBe(builder.getQuest().id);
      expect(env.questPath).toContain(builder.getQuest().id);
      expect(env.files.length).toBeGreaterThan(0);
      expect(env.currentPhase).toBeDefined();
      expect(env.expectedNextAction).toBeDefined();
    });

    test('should validate quest before writing', async () => {
      // Create an invalid quest by manually modifying it
      const quest = builder.getQuest();
      (quest as any).status = 'invalid_status';
      
      await expect(builder.prepareTestEnvironment()).rejects.toThrow('Invalid quest state');
    });

    test('should handle complex quest with all features', async () => {
      const env = await builder
        .inTaskweaverState()
        .inPathseekerState(PhaseStatus.COMPLETE, {
          customComponents: [
            { name: 'api', description: 'API service' },
            { name: 'db', description: 'Database', dependencies: ['api'] }
          ]
        })
        .inCodeweaverState(PhaseStatus.IN_PROGRESS, { partialOnly: true })
        // Complete the implementation before moving on
        .inCodeweaverState(PhaseStatus.COMPLETE)
        .inLawbringerState(PhaseStatus.COMPLETE, { withErrors: true })
        .inSiegemasterState(PhaseStatus.BLOCKED, { errorMessage: 'Tests failing' })
        .inSpiritMenderState(true)
        .inSiegemasterState(PhaseStatus.IN_PROGRESS) // Can't go directly from BLOCKED to COMPLETE
        .inSiegemasterState(PhaseStatus.COMPLETE) // Now complete it
        .inCompletedState()
        .prepareTestEnvironment();
      
      expect(env.currentPhase).toBe('completed');
      expect(env.expectedNextAction).toBe('none');
      
      // Verify quest was written correctly
      const questContent = await fs.readFile(env.questPath, 'utf-8');
      const savedQuest = JSON.parse(questContent);
      expect(savedQuest.status).toBe('completed');
      expect(savedQuest.outcome.status).toBe('success');
    });
  });

  describe('state transitions', () => {
    test('should enforce organic state progression', () => {
      // Can't review before implementing
      expect(() => {
        new QuestStateBuilder(testProject.rootDir, 'Test')
          .inLawbringerState();
      }).not.toThrow(); // Auto-completes previous states
      
      const quest = new QuestStateBuilder(testProject.rootDir, 'Test')
        .inLawbringerState()
        .getQuest();
      
      expect(quest.phases.discovery.status).toBe(PhaseStatus.COMPLETE);
      expect(quest.phases.implementation.status).toBe(PhaseStatus.COMPLETE);
    });

    test('should allow chaining states', () => {
      const quest = builder
        .inTaskweaverState()
        .inPathseekerState()
        .inCodeweaverState()
        .inLawbringerState()
        .inSiegemasterState()
        .inCompletedState()
        .getQuest();
      
      expect(quest.status).toBe(QuestStatus.COMPLETED);
      expect(builder.getStateHistory()).toEqual([
        'quest_creation',
        'pathseeker',
        'codeweaver',
        'lawbringer',
        'siegemaster'
      ]);
    });

    test('should handle error flow', () => {
      const quest = builder
        .inPathseekerState()
        .inCodeweaverState(PhaseStatus.IN_PROGRESS) // First go to IN_PROGRESS
        .inCodeweaverState(PhaseStatus.BLOCKED) // Then BLOCKED
        .inSpiritMenderState(true)
        .inCodeweaverState(PhaseStatus.IN_PROGRESS) // Can't go directly from BLOCKED to COMPLETE
        .inCodeweaverState(PhaseStatus.COMPLETE)
        .getQuest();
      
      expect(quest.status).toBe(QuestStatus.ACTIVE);
      expect(quest.phases.implementation.status).toBe(PhaseStatus.COMPLETE);
      expect(quest.blockers).toEqual([]);
    });
  });

  describe('file generation', () => {
    test('should generate TypeScript files', async () => {
      builder.inCodeweaverState();
      const files = builder.getFiles();
      
      const allTypeScript = Array.from(files.keys()).every(
        path => path.endsWith('.ts')
      );
      expect(allTypeScript).toBe(true);
    });

    test('should generate valid code', async () => {
      builder.inCodeweaverState();
      const files = builder.getFiles();
      
      for (const [filePath, content] of files) {
        if (!filePath.includes('.test.ts')) {
          // Implementation files should have export function
          expect(content).toContain('export function');
          expect(content.includes(': number') || content.includes(': boolean')).toBe(true);
        } else {
          // Test files should have test structure
          expect(content).toContain('describe(');
          expect(content).toContain('test(');
          expect(content).toContain('expect(');
        }
      }
    });
  });
});