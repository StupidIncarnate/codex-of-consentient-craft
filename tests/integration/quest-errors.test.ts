import { ProjectBootstrapper } from '../utils/project-bootstrapper';
import { ClaudeE2ERunner } from '../utils/claude-runner';

jest.setTimeout(120000); // 2 minute timeout for error tests

describe('Error Recovery', () => {
  const bootstrapper = new ProjectBootstrapper();
  let project: any;
  let runner: ClaudeE2ERunner;

  // Cleanup happens on git commit, not after tests
  // This allows debugging of test artifacts

  test.skip('handles ward:all validation failures', async () => {
    // NOTE: This test can't use killOn* flags effectively because ward validation 
    // failures trigger Spiritmender spawning, which happens after the validation message
  });

  test('blocks quest on build errors', async () => {
    // Create quest with build error blocker
    const questFile = {
      filename: 'build-error-20250104.json',
      data: {
        id: 'build-error-20250104',
        title: 'Quest with Build Error',
        status: 'blocked',
        blockers: [{
          type: 'build_failure',
          description: 'TypeScript compilation error in src/main.ts',
          timestamp: new Date().toISOString()
        }],
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
    expect(result.stdout).toContain('TypeScript compilation error');
  });

  test.skip('handles agent spawn failures', async () => {
    // NOTE: This test can't use killOn* flags because agent spawn failures
    // are usually detected during the actual spawning process, not at the initial message
  });
});