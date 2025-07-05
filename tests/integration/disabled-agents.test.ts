import { ProjectBootstrapper } from '../utils/project-bootstrapper';
import { ClaudeE2ERunner } from '../utils/claude-runner';
import { QuestStateBuilder } from '../utils/quest-state-builder';
import { PhaseStatus } from '../utils/quest-state-machine';
import * as fs from 'fs';
import * as path from 'path';

jest.setTimeout(120000); // 2 minute timeout for agent tests

describe('Disabled Agents Configuration', () => {
  const bootstrapper = new ProjectBootstrapper();
  let project: any;
  let runner: ClaudeE2ERunner;

  function createConfigWithDisabledAgent(agentName: string) {
    const configPath = path.join(project.rootDir, '.questmaestro');
    const config = {
      "paths": {
        "questFolder": "questmaestro"
      },
      "commands": {
        "ward": "npm run lint -- $FILE && npm run typecheck -- $FILE && npm run test -- $FILE",
        "ward:all": "npm run lint && npm run typecheck && npm run build && npm run test"
      },
      "features": {
        "parallelExecution": true
      },
      "agents": {
        "disablePathseeker": agentName === 'Pathseeker',
        "disableCodeweaver": agentName === 'Codeweaver',
        "disableLawbringer": agentName === 'Lawbringer',
        "disableSiegemaster": agentName === 'Siegemaster',
        "disableSpiritMender": agentName === 'SpiritMender'
      }
    };
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }

  test('disablePathseeker blocks new quest creation', async () => {
    // Create project
    project = await bootstrapper.createSimpleProject('disable-pathseeker');
    runner = new ClaudeE2ERunner(project.rootDir);
    
    // Create config with Pathseeker disabled
    createConfigWithDisabledAgent('Pathseeker');
    
    const result = await runner.executeCommand(
      '/questmaestro',
      'create new math utils',
      { 
        streaming: true,
        killOnMatch: 'Cannot create new quests: Pathseeker disabled'
      }
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('Cannot create new quests: Pathseeker disabled in configuration');
  });

  test('disablePathseeker blocks discovery phase', async () => {
    // Create project
    project = await bootstrapper.createSimpleProject('disable-pathseeker-discovery');
    
    // Set up quest that needs discovery
    const builder = new QuestStateBuilder(project.rootDir, 'Needs Discovery Quest');
    await builder
      .inTaskweaverState()  // Quest exists but needs discovery
      .prepareTestEnvironment();
    
    // Create config with Pathseeker disabled
    createConfigWithDisabledAgent('Pathseeker');
    
    runner = new ClaudeE2ERunner(project.rootDir);
    
    const result = await runner.executeCommand(
      '/questmaestro',
      '',
      { 
        streaming: true,
        killOnPostAction: true  // Kill when we see [🎁] for blocked status
      }
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('blocked');
    expect(result.stdout).toContain('Pathseeker disabled');
  });

  test('disableCodeweaver blocks implementation phase', async () => {
    // Create project
    project = await bootstrapper.createSimpleProject('disable-codeweaver');
    
    // Set up quest ready for implementation
    const builder = new QuestStateBuilder(project.rootDir, 'Ready for Implementation');
    await builder
      .inPathseekerState(PhaseStatus.COMPLETE, {
        customComponents: [
          { name: 'calculator', description: 'basic calculator functions' }
        ]
      })
      .prepareTestEnvironment();
    
    // Create config with Codeweaver disabled
    createConfigWithDisabledAgent('Codeweaver');
    
    runner = new ClaudeE2ERunner(project.rootDir);
    
    const result = await runner.executeCommand(
      '/questmaestro',
      '',
      { 
        streaming: true,
        killOnPostAction: true  // Kill when we see [🎁] for blocked status
      }
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('blocked');
    expect(result.stdout).toContain('Codeweaver disabled');
  });

  test('disableLawbringer skips review phase', async () => {
    // Create project
    project = await bootstrapper.createSimpleProject('disable-lawbringer');
    
    // Set up quest ready for review
    const builder = new QuestStateBuilder(project.rootDir, 'Ready for Review');
    await builder
      .inCodeweaverState(PhaseStatus.COMPLETE)
      .prepareTestEnvironment();
    
    // Create config with Lawbringer disabled
    createConfigWithDisabledAgent('Lawbringer');
    
    runner = new ClaudeE2ERunner(project.rootDir);
    
    const result = await runner.executeCommand(
      '/questmaestro',
      '',
      { 
        streaming: true,
        killOnAction: true  // Kill when we see [🎲] for Siegemaster spawn (skipped review)
      }
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('Siegemaster');
    expect(result.stdout).toContain('disableLawbringer is true');
  });

  test('disableSiegemaster skips testing phase', async () => {
    // Create project
    project = await bootstrapper.createSimpleProject('disable-siegemaster');
    
    // Set up quest ready for testing
    const builder = new QuestStateBuilder(project.rootDir, 'Ready for Testing');
    await builder
      .inLawbringerState(PhaseStatus.COMPLETE)
      .prepareTestEnvironment();
    
    // Create config with Siegemaster disabled
    createConfigWithDisabledAgent('Siegemaster');
    
    runner = new ClaudeE2ERunner(project.rootDir);
    
    const result = await runner.executeCommand(
      '/questmaestro',
      '',
      { 
        streaming: true,
        killOnMatch: 'disableSiegemaster is true'  // Kill when we see the skip logic
      }
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('disableSiegemaster is true');
  });

  test('disableSpiritMender blocks healing after validation failure', async () => {
    // Create project
    project = await bootstrapper.createSimpleProject('disable-spiritmender');
    
    // Set up quest with validation failure
    const builder = new QuestStateBuilder(project.rootDir, 'Validation Failed Quest');
    await builder
      .inSiegemasterState(PhaseStatus.BLOCKED, {
        errorMessage: 'Build validation failed: Type errors found'
      })
      .prepareTestEnvironment();
    
    // Create config with SpiritMender disabled
    createConfigWithDisabledAgent('SpiritMender');
    
    runner = new ClaudeE2ERunner(project.rootDir);
    
    const result = await runner.executeCommand(
      '/questmaestro',
      '',
      { 
        streaming: true,
        killOnPostAction: true  // Kill when we see [🎁] for blocked status
      }
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('blocked');
    expect(result.stdout).toContain('SpiritMender disabled');
  });

  test('multiple disabled agents work together', async () => {
    // Create project
    project = await bootstrapper.createSimpleProject('multiple-disabled');
    
    // Set up quest ready for review
    const builder = new QuestStateBuilder(project.rootDir, 'Skip Multiple Phases');
    await builder
      .inCodeweaverState(PhaseStatus.COMPLETE)
      .prepareTestEnvironment();
    
    // Create config with both Lawbringer and Siegemaster disabled
    const configPath = path.join(project.rootDir, '.questmaestro');
    const config = {
      "paths": {
        "questFolder": "questmaestro"
      },
      "commands": {
        "ward": "npm run lint -- $FILE && npm run typecheck -- $FILE && npm run test -- $FILE",
        "ward:all": "npm run lint && npm run typecheck && npm run build && npm run test"
      },
      "features": {
        "parallelExecution": true
      },
      "agents": {
        "disablePathseeker": false,
        "disableCodeweaver": false,
        "disableLawbringer": true,
        "disableSiegemaster": true,
        "disableSpiritMender": false
      }
    };
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    runner = new ClaudeE2ERunner(project.rootDir);
    
    const result = await runner.executeCommand(
      '/questmaestro',
      '',
      { 
        streaming: true,
        killOnMatch: 'disableSiegemaster is true'  // Kill when we see skip logic for testing phase
      }
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('disableLawbringer is true');
    expect(result.stdout).toContain('disableSiegemaster is true');
  });

  test('agent disable flags work with parallel Codeweaver execution', async () => {
    // Create project
    project = await bootstrapper.createSimpleProject('disable-with-parallel');
    
    // Set up quest with multiple components for parallel execution
    const builder = new QuestStateBuilder(project.rootDir, 'Parallel Implementation Test');
    await builder
      .inPathseekerState(PhaseStatus.COMPLETE, {
        customComponents: [
          { name: 'service1', description: 'first service' },
          { name: 'service2', description: 'second service' },
          { name: 'service3', description: 'third service' }
        ]
      })
      .prepareTestEnvironment();
    
    // Create config with Lawbringer disabled (should skip review after parallel implementation)
    createConfigWithDisabledAgent('Lawbringer');
    
    runner = new ClaudeE2ERunner(project.rootDir);
    
    const result = await runner.executeCommand(
      '/questmaestro',
      '',
      { 
        streaming: true,
        killOnAction: true  // Kill when we see parallel Codeweavers spawning
      }
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('Summoning 3 Codeweavers');
  });
});