import { ProjectBootstrapper } from '../utils/project-bootstrapper';
import { ClaudeE2ERunner } from '../utils/claude-runner';
import { QuestStateBuilder } from '../utils/quest-state-builder';
import { PhaseStatus, ComponentStatus, QuestStatus, TestPhrases } from '../utils/quest-state-machine';
import * as fs from 'fs';
import * as path from 'path';

jest.setTimeout(120000); // 2 minute timeout for agent tests

describe('Agent Orchestration', () => {
  const bootstrapper = new ProjectBootstrapper();
  let project: any;
  let runner: ClaudeE2ERunner;

  // Cleanup happens on git commit, not after tests
  // This allows debugging of test artifacts

  test('spawns parallel Codeweavers for independent components', async () => {
    // Create project
    project = await bootstrapper.createSimpleProject('parallel-codeweavers');
    
    // Set up quest state with multiple independent components ready for implementation
    const builder = new QuestStateBuilder(project.rootDir, 'Create Math Utilities');
    await builder
      .inPathseekerState(PhaseStatus.COMPLETE, {
        customComponents: [
          { name: 'add', description: 'function that adds two numbers' },
          { name: 'subtract', description: 'function that subtracts two numbers' },
          { name: 'multiply', description: 'function that multiplies two numbers' }
        ]
      })
      .prepareTestEnvironment();
    
    runner = new ClaudeE2ERunner(project.rootDir);
    
    const result = await runner.executeCommand(
      '/questmaestro',
      '',
      { 
        streaming: true,
        killOnAction: true  // Kill when we see [🎲] (main action)
      }
    );
    
    expect(result.success).toBe(true);
  });

  test('respects component dependencies for Codeweaver spawning', async () => {
    // Create project
    project = await bootstrapper.createSimpleProject('component-dependencies');
    
    // Set up quest with components that have dependencies
    const builder = new QuestStateBuilder(project.rootDir, 'Create API Service');
    await builder
      .inPathseekerState(PhaseStatus.COMPLETE, {
        customComponents: [
          { name: 'config', description: 'configuration module' },
          { name: 'logger', description: 'logging utility', dependencies: ['config'] },
          { name: 'database', description: 'database connection', dependencies: ['config'] }
        ]
      })
      .prepareTestEnvironment();
    
    runner = new ClaudeE2ERunner(project.rootDir);
    
    const result = await runner.executeCommand(
      '/questmaestro',
      '',
      { 
        streaming: true,
        killOnAction: true  // Kill when we see [🎲] for Codeweaver spawn
      }
    );
    
    expect(result.success).toBe(true);
  });

  test('spawns Pathseeker for discovery phase', async () => {
    // Create project
    project = await bootstrapper.createSimpleProject('need-discovery');
    
    // Set up quest that needs discovery
    const builder = new QuestStateBuilder(project.rootDir, 'Create Calculator Functions');
    await builder
      .inTaskweaverState(QuestStatus.ACTIVE)  // Only Taskweaver ran, discovery needed
      .prepareTestEnvironment();
    
    runner = new ClaudeE2ERunner(project.rootDir);
    
    const result = await runner.executeCommand(
      '/questmaestro',
      '',
      { 
        streaming: true,
        killOnAction: true  // Kill when we see [🎲] for Pathseeker spawn
      }
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('Pathseeker');
    expect(result.stdout).toContain('discovery');
  });

  test('spawns Lawbringer after all implementations complete', async () => {
    // Create project
    project = await bootstrapper.createSimpleProject('ready-for-review');
    
    // Set up quest with all implementations complete
    const builder = new QuestStateBuilder(project.rootDir, 'Review Calculator');
    await builder
      .inPathseekerState(PhaseStatus.COMPLETE, {
        customComponents: [
          { name: 'add', description: 'adds two numbers' },
          { name: 'subtract', description: 'subtracts two numbers' }
        ]
      })
      .inCodeweaverState(PhaseStatus.COMPLETE)
      .prepareTestEnvironment();
    
    runner = new ClaudeE2ERunner(project.rootDir);
    
    const result = await runner.executeCommand(
      '/questmaestro',
      '',
      { 
        streaming: true,
        killOnAction: true  // Kill when we see [🎲] for Lawbringer spawn
      }
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('Lawbringer');
    expect(result.stdout).toContain('review');
    
    // Verify files were created by state builder
    expect(fs.existsSync(path.join(project.rootDir, 'src/add.ts'))).toBe(true);
    expect(fs.existsSync(path.join(project.rootDir, 'src/subtract.ts'))).toBe(true);
  });

  test('runs ward:all validation after testing', async () => {
    // Create project
    project = await bootstrapper.createSimpleProject('ready-for-validation');
    
    // Set up quest with all phases complete, ready for validation
    const builder = new QuestStateBuilder(project.rootDir, 'Validate Calculator');
    await builder
      .inSiegemasterState(PhaseStatus.COMPLETE)
      .prepareTestEnvironment();
    
    runner = new ClaudeE2ERunner(project.rootDir);
    
    const result = await runner.executeCommand(
      '/questmaestro',
      '',
      { 
        streaming: true,
        killOnAction: true  // Kill when we see [🎲] for ward validation
      }
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('ward:all');
    expect(result.stdout).toContain('validation');
  });

  test('spawns Spiritmender on validation failure', async () => {
    // Create project
    project = await bootstrapper.createSimpleProject('validation-failure');
    
    // Set up quest with test failures that need healing
    const builder = new QuestStateBuilder(project.rootDir, 'Fix Failed Build');
    await builder
      .inSiegemasterState(PhaseStatus.BLOCKED, {
        errorMessage: 'Integration tests failing: Type errors in src/multiply.ts'
      })
      .prepareTestEnvironment();
    
    runner = new ClaudeE2ERunner(project.rootDir);
    
    const result = await runner.executeCommand(
      '/questmaestro',
      '',
      { 
        streaming: true,
        killOnAction: true,  // Kill when we see [🎲] for Spiritmender spawn
        timeout: 180000 // 3 minutes - might need more time
      }
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('Spiritmender');
    expect(result.stdout).toContain('heal');
  });

  test('spawns multiple Codeweavers in parallel for ready components', async () => {
    // Create project
    project = await bootstrapper.createSimpleProject('parallel-implementation');
    
    // Set up quest with partial implementation - some components done, others ready
    const builder = new QuestStateBuilder(project.rootDir, 'Complex Math Library');
    await builder
      .inCodeweaverState(PhaseStatus.IN_PROGRESS, {
        customComponents: [
          { name: 'config', description: 'configuration module' },
          { name: 'add', description: 'addition function', dependencies: ['config'] },
          { name: 'subtract', description: 'subtraction function', dependencies: ['config'] },
          { name: 'multiply', description: 'multiplication function' },
          { name: 'divide', description: 'division function' }
        ],
        partialOnly: true  // Only implement components without dependencies
      })
      .prepareTestEnvironment();
    
    runner = new ClaudeE2ERunner(project.rootDir);
    
    const result = await runner.executeCommand(
      '/questmaestro',
      '',
      { 
        streaming: true,
        killOnAction: true  // Kill when we see [🎲] for component implementation
      }
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('Codeweaver');
    expect(result.stdout).toContain('add');
    expect(result.stdout).toContain('subtract');
    // Config, multiply, and divide should already be done
    expect(result.stdout).not.toContain('config');
  });

  test('handles blocked discovery phase', async () => {
    // Create project
    project = await bootstrapper.createSimpleProject('blocked-discovery');
    
    // Set up quest with blocked discovery
    const builder = new QuestStateBuilder(project.rootDir, 'Complex Analysis Task');
    await builder
      .inPathseekerState(PhaseStatus.BLOCKED, {
        errorMessage: 'Unable to parse existing codebase structure'
      })
      .prepareTestEnvironment();
    
    runner = new ClaudeE2ERunner(project.rootDir);
    
    const result = await runner.executeCommand(
      '/questmaestro',
      '',
      { 
        streaming: true,
        killOnPreAction: true  // Kill when we see [🎯] for blocked status
      }
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('blocked');
    expect(result.stdout).toContain('Unable to parse');
  });

  test('continues in-progress implementation phase', async () => {
    // Create project
    project = await bootstrapper.createSimpleProject('continue-implementation');
    
    // Set up quest with some components still in progress
    const builder = new QuestStateBuilder(project.rootDir, 'API Endpoints');
    const quest = builder.getQuest();
    
    // Manually set up a more complex state
    await builder.inPathseekerState(PhaseStatus.COMPLETE, {
      customComponents: [
        { name: 'userController', description: 'user management endpoints' },
        { name: 'authController', description: 'authentication endpoints' },
        { name: 'productController', description: 'product management endpoints' }
      ]
    });
    
    // Manually mark one component as in-progress
    quest.phases.implementation.components[1].status = ComponentStatus.IN_PROGRESS;
    quest.activeAgents = [{ id: 'codeweaver-123', task: 'authController' }];
    
    await builder.prepareTestEnvironment();
    
    runner = new ClaudeE2ERunner(project.rootDir);
    
    const result = await runner.executeCommand(
      '/questmaestro',
      '',
      { 
        streaming: true,
        killOnPreAction: true  // Kill when we see [🎯] for in-progress status
      }
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('authController');
    expect(result.stdout).toContain('progress');
  });

  test('spawns Siegemaster after review complete', async () => {
    // Create project
    project = await bootstrapper.createSimpleProject('ready-for-testing');
    
    // Set up quest with review complete, ready for testing
    const builder = new QuestStateBuilder(project.rootDir, 'Test Math Library');
    await builder
      .inLawbringerState(PhaseStatus.COMPLETE)
      .prepareTestEnvironment();
    
    runner = new ClaudeE2ERunner(project.rootDir);
    
    const result = await runner.executeCommand(
      '/questmaestro',
      '',
      { 
        streaming: true,
        killOnAction: true  // Kill when we see [🎲] for Siegemaster spawn
      }
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('Siegemaster');
    expect(result.stdout).toContain('test');
  });
});