import { ProjectBootstrapper } from '../../tests/utils/project-bootstrapper';
import { ClaudeE2ERunner } from '../../tests/utils/claude-runner';
import { QuestStateBuilder } from '../../tests/utils/quest-state-builder';
import { PhaseStatus } from '../../tests/utils/quest-state-machine';

jest.setTimeout(120000); // 2 minute timeout

describe('Parallel Execution', () => {
  const bootstrapper = new ProjectBootstrapper();
  let project: any;
  let runner: ClaudeE2ERunner;

  // Cleanup happens on git commit, not after tests
  // This allows debugging of test artifacts

  test('identifies components ready for parallel work', async () => {
    // Create project
    project = await bootstrapper.createSimpleProject('parallel-ready');
    
    // Create quest with multiple independent components
    const builder = new QuestStateBuilder(project.rootDir, 'Parallel Components Quest');
    await builder
      .inPathseekerState(PhaseStatus.COMPLETE, {
        customComponents: [
          { name: 'component-a', description: 'independent component A' },
          { name: 'component-b', description: 'independent component B' },
          { name: 'component-c', description: 'independent component C' }
        ]
      })
      .prepareTestEnvironment();
    
    runner = new ClaudeE2ERunner(project.rootDir);
    
    const result = await runner.executeCommand(
      '/questmaestro',
      '',
      { killOnAction: true } // Kill when we see [🎲] (spawning multiple Codeweavers)
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('Summoning');
    expect(result.stdout).toContain('Codeweaver');
    // Should indicate multiple spawns
    expect(result.stdout).toMatch(/3|multiple|parallel/i);
  });

  test.skip('tracks multiple active Codeweavers', async () => {
    // NOTE: This test can't use killOn* flags because tracking active agents
    // requires the agents to actually be spawned and tracked in the quest state
  });

  test.skip('waits for all components before review', async () => {
    // NOTE: This test can't use killOn* flags because it needs to verify
    // that review doesn't start until ALL components are complete
  });
});