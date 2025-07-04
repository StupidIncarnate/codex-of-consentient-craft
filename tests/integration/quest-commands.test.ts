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
      { killOnMatch: 'Working on' }
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
      { killOnMatch: 'no active quest' }
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
            testing: { status: 'not_started' }
          }
        }
      }
    ];
    
    project = await bootstrapper.createProjectWithQuests('simple', questFiles);
    runner = new ClaudeE2ERunner(project.rootDir);
    
    const result = await runner.executeCommand(
      '/questmaestro',
      'list',
      { killOnMatch: 'Stats:' }
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

    // Verify quest moved to abandoned
    const tracker = JSON.parse(
      fs.readFileSync(
        path.join(project.rootDir, 'questmaestro', 'quest-tracker.json'),
        'utf8'
      )
    );
    expect(tracker.active).toHaveLength(0);
    expect(tracker.abandoned).toContain('test-quest-20250103.json');
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
      { killOnMatch: 'Login Feature' }
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('Login Feature');
  });

  test('new task - spawns Taskweaver for quest creation', async () => {
    project = await bootstrapper.createSimpleProject('new-quest');
    runner = new ClaudeE2ERunner(project.rootDir);
    
    const result = await runner.executeCommand(
      '/questmaestro',
      'add a function that validates email addresses',
      { killOnMatch: 'Taskweaver' }
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('Taskweaver');
  });
});