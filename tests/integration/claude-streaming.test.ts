import { ClaudeE2ERunner } from '../utils/claude-runner';
import { ProjectBootstrapper } from '../utils/project-bootstrapper';

describe('Claude Streaming Test', () => {
  let project: any;
  let runner: any;

  beforeEach(async () => {
    const bootstrapper = new ProjectBootstrapper();
    project = await bootstrapper.createSimpleProject('claude-streaming-test');
    runner = new ClaudeE2ERunner(project.rootDir);
  });

  // Cleanup happens on git commit, not after tests
  // This allows debugging of test artifacts

  test('should handle options parameter correctly', async () => {
    // Test that options parameter works (even if streaming isn't implemented yet)
    const result = await runner.executeCommand(
      'Say hello. Think hard about how you feel. Then send a joke afterward',
      '',
      { streaming: true, timeout: 30000 }
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout).toBeTruthy();
    expect(result.stdout.toLowerCase()).toContain('hello');
  }, 30000);

  test('should handle non-streaming mode as before', async () => {
    // Verify non-streaming still works
    const result = await runner.executeCommand('Say hello');
    
    expect(result.success).toBe(true);
    expect(result.stdout).toBeTruthy();
    expect(result.stdout.toLowerCase()).toContain('hello');
  }, 30000);
});