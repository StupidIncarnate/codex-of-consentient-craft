import { ProjectBootstrapper } from '../utils/project-bootstrapper';
import { ClaudeE2ERunner } from '../utils/claude-runner';

jest.setTimeout(60000); // 1 minute timeout

describe('Quest Completion', () => {
  const bootstrapper = new ProjectBootstrapper();
  let project: any;
  let runner: ClaudeE2ERunner;

  // Cleanup happens on git commit, not after tests
  // This allows debugging of test artifacts

  test('marks quest complete when all phases done', async () => {
    // Create quest with all phases complete
    const questFile = {
      filename: 'ready-complete-20250104.json',
      data: {
        id: 'ready-complete-20250104',
        title: 'Quest Ready for Completion',
        status: 'active',
        phases: {
          discovery: { status: 'complete' },
          implementation: { status: 'complete', components: [] },
          review: { status: 'complete' },
          testing: { status: 'complete' }
        }
      }
    };
    
    project = await bootstrapper.createProjectWithQuests('simple', [questFile]);
    runner = new ClaudeE2ERunner(project.rootDir);
    
    const result = await runner.executeCommand(
      '/questmaestro',
      '',
      { killOnPostAction: true } // Kill when we see [🎁] (quest complete message)
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('Quest complete');
    expect(result.stdout).toContain('vanquished');
  });

  test.skip('moves quest file to completed folder', async () => {
    // NOTE: This test can't use killOn* flags because file movement happens AFTER the kill point
    // File operations occur after the quest completion message is displayed
  });

  test.skip('starts next quest automatically', async () => {
    // NOTE: This test can't use killOn* flags because it needs to verify the next quest starts
    // The next quest startup happens after the completion post-action
  });
});