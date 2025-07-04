const { ProjectBootstrapper } = require('../utils/project-bootstrapper');
const { ClaudeE2ERunner } = require('../utils/claude-runner');
const fs = require('fs');
const path = require('path');

jest.setTimeout(60000); // 1 minute timeout

describe('Quest in Monorepo', () => {
  const bootstrapper = new ProjectBootstrapper();
  let project;
  let runner;

  // Cleanup happens on git commit, not after tests
  // This allows debugging of test artifacts

  test('Quest commands in monorepo context', async () => {
    // Create a monorepo project
    project = await bootstrapper.createMonorepo('e2e-monorepo');
    runner = new ClaudeE2ERunner(project.rootDir);

    // Test basic quest creation in monorepo context
    const result = await runner.executeCommand(
      '/questmaestro', 
      'add API endpoint',
      { killOnMatch: 'Creating quest' }
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('quest');

    // Verify monorepo-specific config is used
    const config = JSON.parse(
      fs.readFileSync(path.join(project.rootDir, '.questmaestro'), 'utf8')
    );
    expect(config.commands.ward).toContain('--workspace=');
  });
});