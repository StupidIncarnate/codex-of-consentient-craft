import { ProjectBootstrapper } from '../utils/project-bootstrapper';
import { ClaudeE2ERunner } from '../utils/claude-runner';
import { QuestStateBuilder } from '../utils/quest-state-builder';
import { PhaseStatus } from '../utils/quest-state-machine';

jest.setTimeout(60000); // 1 minute timeout

describe('Report Parsing', () => {
  const bootstrapper = new ProjectBootstrapper();
  let project: any;
  let runner: ClaudeE2ERunner;

  // Cleanup happens on git commit, not after tests
  // This allows debugging of test artifacts

  test('parses Taskweaver quest definition', async () => {
    // Create project without quests to trigger Taskweaver
    project = await bootstrapper.createSimpleProject('taskweaver-parsing');
    runner = new ClaudeE2ERunner(project.rootDir);
    
    const result = await runner.executeCommand(
      '/questmaestro',
      'create user authentication system',
      { killOnPostAction: true } // Kill when we see [🎁] (parsing Taskweaver report)
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('Parsing');
    expect(result.stdout).toContain('Taskweaver');
  });

  test('parses Pathseeker discovery findings', async () => {
    // Create project first
    project = await bootstrapper.createSimpleProject('pathseeker-parsing');
    
    // Create quest ready for discovery
    const builder = new QuestStateBuilder(project.rootDir, 'Discovery Test Quest');
    await builder.prepareTestEnvironment();
    runner = new ClaudeE2ERunner(project.rootDir);
    
    const result = await runner.executeCommand(
      '/questmaestro',
      '',
      { killOnPostAction: true } // Kill when we see [🎁] (parsing Pathseeker report)
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('Parsing');
    expect(result.stdout).toContain('Pathseeker');
  });

  test('parses Codeweaver implementation results', async () => {
    // Create project first
    project = await bootstrapper.createSimpleProject('codeweaver-parsing');
    
    // Create quest ready for implementation
    const builder = new QuestStateBuilder(project.rootDir, 'Implementation Test Quest');
    await builder
      .inPathseekerState(PhaseStatus.COMPLETE, {
        customComponents: [{ name: 'simple-function', description: 'a basic function' }]
      })
      .prepareTestEnvironment();
    runner = new ClaudeE2ERunner(project.rootDir);
    
    const result = await runner.executeCommand(
      '/questmaestro',
      '',
      { killOnPostAction: true } // Kill when we see [🎁] (parsing Codeweaver report)
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('Parsing');
    expect(result.stdout).toContain('Codeweaver');
  });

  test.skip('handles malformed agent reports gracefully', async () => {
    // NOTE: This test can't use killOn* flags because malformed reports are detected
    // during the parsing process, not at the initial parsing message
  });
});