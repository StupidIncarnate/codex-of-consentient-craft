import { HookPreMcpCallerFlow } from './hook-pre-mcp-caller-flow';

describe('HookPreMcpCallerFlow', () => {
  describe('delegation to responder', () => {
    it('VALID: {sub-agent MCP call JSON} => returns exitCode 0 with the caller context in updatedInput', () => {
      const inputData = JSON.stringify({
        session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        transcript_path: '/tmp/transcript.jsonl',
        cwd: '/home/user/repo/worktrees/x',
        hook_event_name: 'PreToolUse',
        tool_name: 'mcp__dungeonmaster__get-agent-prompt',
        tool_input: { agent: 'codeweaver-worker', questId: 'q1', workItemId: 'w1' },
        tool_use_id: 'toolu_01FFiiwPHAMdWJBNPagp7TBG',
        agent_id: 'a493e1c2168b46114',
      });

      const result = HookPreMcpCallerFlow({ inputData });

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            updatedInput: {
              agent: 'codeweaver-worker',
              questId: 'q1',
              workItemId: 'w1',
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

    it('VALID: {hook data it cannot read} => returns exitCode 0 with empty stdout so the call goes ahead unchanged', () => {
      const inputData = JSON.stringify({ hook_event_name: 'PreToolUse', tool_input: {} });

      const result = HookPreMcpCallerFlow({ inputData });

      expect(result).toStrictEqual({ exitCode: 0, stdout: '', stderr: '' });
    });

    it('ERROR: {inputData: not JSON} => returns exitCode 1 with the parse error in stderr', () => {
      const result = HookPreMcpCallerFlow({ inputData: 'not json' });

      expect(result).toStrictEqual({
        exitCode: 1,
        stdout: '',
        stderr: `Hook error: Unexpected token 'o', "not json" is not valid JSON\n`,
      });
    });
  });
});
