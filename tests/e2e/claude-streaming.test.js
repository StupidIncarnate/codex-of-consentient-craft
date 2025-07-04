const { ClaudeE2ERunner } = require('./claude-runner');
const { ProjectBootstrapper } = require('../utils/project-bootstrapper');

describe('Claude Streaming Test', () => {
  let project;
  let runner;

  beforeEach(async () => {
    const bootstrapper = new ProjectBootstrapper();
    project = await bootstrapper.createSimpleProject('claude-streaming-test');
    runner = new ClaudeE2ERunner(project.rootDir);
  });

  afterEach(async () => {
    if (project && project.cleanup) {
      await project.cleanup();
    }
  });

  test('should handle options parameter correctly', async () => {
    // Test that options parameter works (even if streaming isn't implemented yet)
    const result = await runner.executeCommand(
      'Say hello. Think hard about how you feel. Then send a joke afterward',
      '',
      { streaming: true, timeout: 10000 }
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