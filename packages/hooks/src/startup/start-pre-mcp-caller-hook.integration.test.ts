import { hookPersistentRunnerHarness } from '../../test/harnesses/hook-runner/hook-persistent-runner.harness';

describe('pre-mcp-caller-hook', () => {
  const persistentRunner = hookPersistentRunnerHarness();

  beforeAll(async () => {
    await persistentRunner.start({ hookName: 'start-pre-mcp-caller-hook' });
  });

  afterAll(async () => {
    await persistentRunner.stop();
  });

  it('VALID: {top-level session calls discover} => writes updatedInput with the original input and the caller context', async () => {
    const result = await persistentRunner.runHook({
      hookData: {
        session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        transcript_path: '/tmp/transcript.jsonl',
        cwd: '/home/user/repo',
        hook_event_name: 'PreToolUse',
        tool_name: 'mcp__dungeonmaster__discover',
        tool_input: { glob: 'packages/siegelense/src/**', grep: 'stack|api', context: 2 },
        tool_use_id: 'toolu_01GUAF4Zz6qyfqHde3KeZ7r3',
      },
    });

    expect(result).toStrictEqual({
      exitCode: 0,
      stdout: JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          updatedInput: {
            glob: 'packages/siegelense/src/**',
            grep: 'stack|api',
            context: 2,
            dungeonmasterCaller: {
              cwd: '/home/user/repo',
              sessionId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            },
          },
        },
      }),
      stderr: '',
    });
  });

  it('VALID: {sub-agent in a worktree calls get-agent-prompt} => includes the agentId', async () => {
    const result = await persistentRunner.runHook({
      hookData: {
        session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        transcript_path: '/tmp/transcript.jsonl',
        cwd: '/home/user/repo/worktrees/x',
        hook_event_name: 'PreToolUse',
        tool_name: 'mcp__dungeonmaster__get-agent-prompt',
        tool_input: { agent: 'codeweaver-worker' },
        tool_use_id: 'toolu_01FFiiwPHAMdWJBNPagp7TBG',
        agent_id: 'a493e1c2168b46114',
      },
    });

    expect(result).toStrictEqual({
      exitCode: 0,
      stdout: JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          updatedInput: {
            agent: 'codeweaver-worker',
            dungeonmasterCaller: {
              cwd: '/home/user/repo/worktrees/x',
              sessionId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
              agentId: 'a493e1c2168b46114',
            },
          },
        },
      }),
      stderr: '',
    });
  });
});
