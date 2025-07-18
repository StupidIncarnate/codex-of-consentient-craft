import { ClaudeE2ERunner } from '../../tests/utils/claude-runner';
import { ProjectBootstrapper } from '../../tests/utils/project-bootstrapper';

describe('Claude Headless Basic Test', () => {
  let project: any;
  let runner: any;

  beforeEach(async () => {
    const bootstrapper = new ProjectBootstrapper();
    project = await bootstrapper.createSimpleProject('claude-basic-test');
    runner = new ClaudeE2ERunner(project.rootDir);
  });

  // Cleanup happens on git commit, not after tests
  // This allows debugging of test artifacts

  test('should get response from Claude for simple prompt', async () => {
    // Just test a basic prompt, not a slash command
    const result = await runner.executeCommand('Quack like a duck');
    
    console.log('Result:', result);
    
    expect(result.success).toBe(true);
    expect(result.stdout).toBeTruthy();
    expect(result.stdout.toLowerCase()).toMatch(/quack|duck/i);
  }, 30000);
});