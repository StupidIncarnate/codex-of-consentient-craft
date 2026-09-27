import { mcpPreToolUseHookDataContract } from './mcp-pre-tool-use-hook-data-contract';
import { McpPreToolUseHookDataStub } from './mcp-pre-tool-use-hook-data.stub';

describe('mcpPreToolUseHookDataContract', () => {
  it('VALID: {top-level session call} => parses with the tool input intact', () => {
    const result = mcpPreToolUseHookDataContract.parse(McpPreToolUseHookDataStub());

    expect(result).toStrictEqual({
      session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      cwd: '/home/user/repo',
      hook_event_name: 'PreToolUse',
      tool_name: 'mcp__dungeonmaster__discover',
      tool_input: { glob: 'packages/*/src/**' },
    });
  });

  it('VALID: {sub-agent call with extra hook fields} => keeps agent_id and drops fields it does not declare', () => {
    const result = mcpPreToolUseHookDataContract.parse({
      session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      transcript_path: '/home/user/.claude/projects/-home-user-repo/s.jsonl',
      cwd: '/home/user/repo/worktrees/x',
      hook_event_name: 'PreToolUse',
      tool_name: 'mcp__dungeonmaster__get-agent-prompt',
      tool_input: { agent: 'codeweaver-worker', nested: { keep: [1, 2] } },
      tool_use_id: 'toolu_01FFiiwPHAMdWJBNPagp7TBG',
      agent_id: 'a493e1c2168b46114',
    });

    expect(result).toStrictEqual({
      session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      cwd: '/home/user/repo/worktrees/x',
      hook_event_name: 'PreToolUse',
      tool_name: 'mcp__dungeonmaster__get-agent-prompt',
      tool_input: { agent: 'codeweaver-worker', nested: { keep: [1, 2] } },
      agent_id: 'a493e1c2168b46114',
    });
  });

  it('INVALID: {cwd: relative} => throws', () => {
    expect(() =>
      mcpPreToolUseHookDataContract.parse({
        session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        cwd: 'repo',
        hook_event_name: 'PreToolUse',
        tool_name: 'mcp__dungeonmaster__discover',
        tool_input: {},
      }),
    ).toThrow(/Path must be absolute/u);
  });

  it('INVALID: {hook_event_name: PostToolUse} => throws', () => {
    expect(() =>
      mcpPreToolUseHookDataContract.parse({
        session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        cwd: '/home/user/repo',
        hook_event_name: 'PostToolUse',
        tool_name: 'mcp__dungeonmaster__discover',
        tool_input: {},
      }),
    ).toThrow(/Invalid literal value/u);
  });
});
