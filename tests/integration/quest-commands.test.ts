import { ProjectBootstrapper } from '../utils/project-bootstrapper';
import { ClaudeE2ERunner } from '../utils/claude-runner';
import * as fs from 'fs';
import * as path from 'path';

jest.setTimeout(60000); // 1 minute timeout

describe('Quest Command Routing', () => {
  const bootstrapper = new ProjectBootstrapper();
  let project;
  let runner;

  // Cleanup happens on git commit, not after tests
  // This allows debugging of test artifacts

  test('no argument - continues active quest if exists', async () => {
    const questFile = {
      filename: 'active-quest-20250104.json',
      data: {
        id: 'active-quest-20250104',
        title: 'Active Quest Test',
        status: 'active',
        phases: {
          discovery: { status: 'in_progress' }
        }
      }
    };
    
    project = await bootstrapper.createProjectWithQuests('simple', [questFile]);
    runner = new ClaudeE2ERunner(project.rootDir);
    
    const result = await runner.executeCommand(
      '/questmaestro',
      '',
      { killOnPreAction: true }
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('Active Quest Test');
  });

  test('no argument - prompts to create quest if none active', async () => {
    project = await bootstrapper.createSimpleProject('no-active-quest');
    runner = new ClaudeE2ERunner(project.rootDir);
    
    // Ensure quest folder exists but is empty
    const questFolder = path.join(project.rootDir, 'questmaestro');
    fs.mkdirSync(questFolder, { recursive: true });
    fs.writeFileSync(
      path.join(questFolder, 'quest-tracker.json'),
      JSON.stringify({ active: [], completed: [], abandoned: [] })
    );
    
    const result = await runner.executeCommand(
      '/questmaestro',
      '',
      { killOnPreAction: true }
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout.toLowerCase()).toContain('no active');
  });

  test('list - shows formatted quest status with progress', async () => {
    const questFiles = [
      {
        filename: 'quest1-20250104.json',
        data: {
          id: 'quest1-20250104',
          title: 'Fix Login Bug',
          status: 'active',
          phases: {
            discovery: { status: 'complete' },
            implementation: { status: 'in_progress' },
            review: { status: 'not_started' },
            gapAnalysis: { status: 'not_started' }
          }
        }
      }
    ];
    
    project = await bootstrapper.createProjectWithQuests('simple', questFiles);
    runner = new ClaudeE2ERunner(project.rootDir);
    
    const result = await runner.executeCommand(
      '/questmaestro',
      'list',
      { killOnPreAction: true }
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('Active Quest');
    expect(result.stdout).toContain('Fix Login Bug');
    expect(result.stdout).toContain('Progress:');
  });

  test('abandon - confirms and moves quest to abandoned', async () => {
    project = await bootstrapper.createProjectWithQuests('simple', [{
      filename: 'test-quest-20250103.json',
      data: {
        id: 'test-quest-20250103',
        title: 'Test Quest',
        status: 'active',
        phases: {
          discovery: { status: 'in_progress' }
        }
      }
    }]);
    runner = new ClaudeE2ERunner(project.rootDir);

    // Abandon the quest
    const result = await runner.executeCommand('/questmaestro', 'abandon');
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('abandon');

  });

  test('start <name> - fuzzy matches existing quest', async () => {
    const questFiles = [
      {
        filename: 'login-feature-20250104.json',
        data: {
          id: 'login-feature-20250104',
          title: 'Implement Login Feature',
          status: 'active',
          phases: { discovery: { status: 'not_started' } }
        }
      },
      {
        filename: 'search-feature-20250104.json',
        data: {
          id: 'search-feature-20250104',
          title: 'Add Search Functionality',
          status: 'active',
          phases: { discovery: { status: 'not_started' } }
        }
      }
    ];
    
    project = await bootstrapper.createProjectWithQuests('simple', questFiles);
    
    // Put search quest first in active array
    const tracker = JSON.parse(
      fs.readFileSync(path.join(project.rootDir, 'questmaestro/quest-tracker.json'), 'utf8')
    );
    tracker.active = ['search-feature-20250104.json', 'login-feature-20250104.json'];
    fs.writeFileSync(
      path.join(project.rootDir, 'questmaestro/quest-tracker.json'),
      JSON.stringify(tracker)
    );
    
    runner = new ClaudeE2ERunner(project.rootDir);
    
    const result = await runner.executeCommand(
      '/questmaestro',
      'start login',
      { killOnPreAction: true }
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('Login Feature');
  });

  test('new task - spawns Pathseeker for quest creation', async () => {
    project = await bootstrapper.createSimpleProject('new-quest');
    runner = new ClaudeE2ERunner(project.rootDir);
    
    const result = await runner.executeCommand(
      '/questmaestro',
      'add a function that validates email addresses',
      { killOnPostAction: true }
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('Pathseeker');
  });

  // NEW PATHSEEKER FLOW TESTS
  describe.skip('Questmaestro <=> Pathseeker Integration', () => {
    test.skip('should enter planning mode when Pathseeker reports INSUFFICIENT_CONTEXT', async () => {
      // Test vague request that requires planning mode
      // Expected flow:
      // 1. User: "fix some stuff"
      // 2. Questmaestro spawns Pathseeker
      // 3. Pathseeker returns INSUFFICIENT_CONTEXT with specific questions
      // 4. Questmaestro enters planning mode, displays progress, asks user questions
      // 5. User provides clarification
      // 6. Questmaestro respawns Pathseeker with enhanced context
      // 7. Pathseeker returns SUCCESS with complete quest definition
      // 8. Questmaestro creates quest and begins execution
    });

    test.skip('should create quest directly when Pathseeker has sufficient context', async () => {
      // Test detailed request that Pathseeker can handle immediately
      // Expected flow:
      // 1. User: "add a TypeScript function in src/utils.ts that validates email addresses using regex"
      // 2. Questmaestro spawns Pathseeker
      // 3. Pathseeker explores codebase and returns SUCCESS with complete quest
      // 4. Questmaestro creates quest file with discovery already marked complete
      // 5. Questmaestro begins implementation phase
    });

    test.skip('should handle multiple planning iterations', async () => {
      // Test that requires multiple back-and-forth rounds
      // Expected flow:
      // 1. User: "make the app better"
      // 2. Pathseeker: INSUFFICIENT_CONTEXT - needs scope clarification
      // 3. User: "improve performance"
      // 4. Pathseeker: INSUFFICIENT_CONTEXT - needs specific performance areas
      // 5. User: "optimize database queries in user service"
      // 6. Pathseeker: SUCCESS - creates complete quest
    });

    test.skip('should display proper planning mode format', async () => {
      // Test the visual format of planning mode
      // Should show:
      // 🗡️ QUEST PLANNING MODE 🗡️
      // 🔍 Current Understanding: [pathseeker findings]
      // 🏗️ Codebase Exploration Results: [what pathseeker found]
      // ❓ Still Need Clarification: [specific gaps]
      // 📋 Next: [specific question]
    });

    test.skip('should preserve context between planning iterations', async () => {
      // Test that accumulated context is passed between Pathseeker runs
      // Each Pathseeker spawn should receive:
      // - Original user request
      // - Previous findings
      // - User clarifications
      // - All accumulated context
    });

    test.skip('should handle quest creation for existing quest discovery', async () => {
      // Test Pathseeker doing discovery on an existing quest
      // vs creating a new quest from user input
      // Different code paths in questmaestro parsing logic
    });

    test.skip('should parse SUCCESS reports correctly for quest creation vs discovery', async () => {
      // Test that Questmaestro correctly identifies:
      // - Quest creation (has "Quest Details" section) 
      // - Discovery completion (no "Quest Details" section)
      // And handles each appropriately
    });

    test.skip('should handle planning mode cancellation', async () => {
      // Test user canceling during planning mode
      // User responds with "cancel" or "nevermind"
      // Should exit planning mode and wait for next command
    });

    test.skip('should handle planning mode context switches', async () => {
      // Test user providing completely different request during planning
      // Should abandon current planning and start over with new context
    });

    test.skip('should validate Pathseeker architectural contracts', async () => {
      // Test that Pathseeker properly defines:
      // - Component interfaces (APIs, schemas, types)
      // - Integration points (routes, endpoints, events)  
      // - Data contracts (data flow between components)
      // - Architectural decisions (patterns, libraries)
      // - Dependencies (what each component needs)
    });
  });
});