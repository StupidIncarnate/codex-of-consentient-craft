import { ProjectBootstrapper } from '../utils/project-bootstrapper';
import { ClaudeE2ERunner } from '../utils/claude-runner';
import * as fs from 'fs';
import * as path from 'path';

jest.setTimeout(60000); // 1 minute timeout

describe('Quest State Management', () => {
  const bootstrapper = new ProjectBootstrapper();
  let project;
  let runner;

  // Cleanup happens on git commit, not after tests
  // This allows debugging of test artifacts

  test('moves quest to top when started', async () => {
    const questFiles = [
      {
        filename: 'quest-a-20250104.json',
        data: {
          id: 'quest-a-20250104',
          title: 'Quest A',
          status: 'active',
          phases: { discovery: { status: 'not_started' } }
        }
      },
      {
        filename: 'quest-b-20250104.json',
        data: {
          id: 'quest-b-20250104',
          title: 'Quest B',
          status: 'active',
          phases: { discovery: { status: 'not_started' } }
        }
      }
    ];
    
    project = await bootstrapper.createProjectWithQuests('simple', questFiles);
    
    // Set initial order
    const trackerPath = path.join(project.rootDir, 'questmaestro/quest-tracker.json');
    const tracker = JSON.parse(fs.readFileSync(trackerPath, 'utf8'));
    tracker.active = ['quest-a-20250104.json', 'quest-b-20250104.json'];
    fs.writeFileSync(trackerPath, JSON.stringify(tracker));
    
    runner = new ClaudeE2ERunner(project.rootDir);
    
    const result = await runner.executeCommand(
      '/questmaestro',
      'start quest b',
      { killOnPreAction: true } // Kill when we see [🎯] (continuing quest message)
    );
    
    expect(result.success).toBe(true);
    
    // Verify order changed
    const updatedTracker = JSON.parse(fs.readFileSync(trackerPath, 'utf8'));
    expect(updatedTracker.active[0]).toBe('quest-b-20250104.json');
  });

  test('updates quest-tracker.json arrays correctly', async () => {
    const questFile = {
      filename: 'tracker-test-20250104.json',
      data: {
        id: 'tracker-test-20250104',
        title: 'Tracker Test Quest',
        status: 'active',
        phases: {
          discovery: { status: 'complete' },
          implementation: { status: 'complete' },
          review: { status: 'complete' },
          testing: { status: 'complete' }
        }
      }
    };
    
    project = await bootstrapper.createProjectWithQuests('simple', [questFile]);
    runner = new ClaudeE2ERunner(project.rootDir);
    
    // This would trigger completion
    await runner.executeCommand(
      '/questmaestro',
      '',
      { killOnPostAction: true } // Kill when we see [🎁] (quest complete message)
    );
    
    const tracker = JSON.parse(
      fs.readFileSync(path.join(project.rootDir, 'questmaestro/quest-tracker.json'), 'utf8')
    );
    
    expect(tracker.active).not.toContain('tracker-test-20250104.json');
    expect(tracker.completed).toContain('tracker-test-20250104.json');
  });

  test('handles blocked status with error details', async () => {
    const questFile = {
      filename: 'blocked-quest-20250104.json',
      data: {
        id: 'blocked-quest-20250104',
        title: 'Quest with Build Error',
        status: 'blocked',
        blockers: [
          {
            type: 'build_failure',
            description: 'ESLint error in src/test.ts',
            timestamp: new Date().toISOString()
          }
        ],
        phases: {
          discovery: { status: 'complete' },
          implementation: { status: 'complete' }
        }
      }
    };
    
    project = await bootstrapper.createProjectWithQuests('simple', [questFile]);
    runner = new ClaudeE2ERunner(project.rootDir);
    
    const result = await runner.executeCommand(
      '/questmaestro',
      '',
      { killOnPostAction: true } // Kill when we see [🎁] (quest blocked message)
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('Quest blocked');
    expect(result.stdout).toContain('ESLint error');
  });
});