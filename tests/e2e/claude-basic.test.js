const { ClaudeE2ERunner } = require('./claude-runner');
const { ProjectBootstrapper } = require('../utils/project-bootstrapper');

describe('Claude Headless Basic Test', () => {
  let project;
  let runner;

  beforeEach(async () => {
    const bootstrapper = new ProjectBootstrapper();
    project = await bootstrapper.createSimpleProject('claude-basic-test');
    runner = new ClaudeE2ERunner(project.rootDir);
  });

  afterEach(async () => {
    if (project && project.cleanup) {
      await project.cleanup();
    }
  });

  test('should get response from Claude for simple prompt', async () => {
    // Just test a basic prompt, not a slash command
    const result = await runner.executeCommand('Quack like a duck');
    
    console.log('Result:', result);
    
    expect(result.success).toBe(true);
    expect(result.stdout).toBeTruthy();
    expect(result.stdout.toLowerCase()).toMatch(/quack|duck/i);
  }, 30000);
});