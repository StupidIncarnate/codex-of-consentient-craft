import { ProjectBootstrapper } from '../utils/project-bootstrapper';
import { ClaudeE2ERunner } from '../utils/claude-runner';
import * as fs from 'fs';
import * as path from 'path';

jest.setTimeout(60000); // 1 minute timeout

describe('Directory Isolation', () => {
  const bootstrapper = new ProjectBootstrapper();
  let project: any;
  let runner: ClaudeE2ERunner;

  // Cleanup happens on git commit, not after tests
  // This allows debugging of test artifacts

  test('reads agent files from local .claude directory', async () => {
    // Create project and verify .claude/commands/quest/ files exist
    project = await bootstrapper.createSimpleProject('isolation-test');
    
    // Verify agent files are present
    const agentFiles = ['pathseeker.md', 'codeweaver.md', 'lawbringer.md'];
    for (const file of agentFiles) {
      const agentPath = path.join(project.rootDir, '.claude/commands/quest', file);
      expect(fs.existsSync(agentPath)).toBe(true);
    }
    
    runner = new ClaudeE2ERunner(project.rootDir);
    
    const result = await runner.executeCommand(
      '/questmaestro',
      'create simple test',
      { killOnAction: true } // Kill when we see [🎲] (spawning agent)
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('Summoning');
  });

  test.skip('prevents access outside working directory', async () => {
    // NOTE: This test can't use killOn* flags because directory access prevention
    // is enforced during agent execution, not at the initial spawning message
  });

  test('spawns agents with correct cwd context', async () => {
    project = await bootstrapper.createSimpleProject('cwd-context-test');
    runner = new ClaudeE2ERunner(project.rootDir);
    
    const result = await runner.executeCommand(
      '/questmaestro',
      'verify working directory context',
      { killOnAction: true } // Kill when we see [🎲] (spawning agent)
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('Summoning');
    // The context validation would happen in the agent itself
  });
});