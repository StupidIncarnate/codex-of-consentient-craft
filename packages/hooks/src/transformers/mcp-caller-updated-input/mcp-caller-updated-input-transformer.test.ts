import { McpPreToolUseHookDataStub } from '../../contracts/mcp-pre-tool-use-hook-data/mcp-pre-tool-use-hook-data.stub';
import { mcpCallerUpdatedInputTransformer } from './mcp-caller-updated-input-transformer';

describe('mcpCallerUpdatedInputTransformer', () => {
  it('VALID: {top-level session call} => echoes the input and adds cwd and sessionId', () => {
    const hookData = McpPreToolUseHookDataStub({
      tool_input: { glob: 'packages/*/src/**', grep: 'stack|api', context: 2 },
    });

    const result = mcpCallerUpdatedInputTransformer({ hookData });

    expect(result).toStrictEqual({
      glob: 'packages/*/src/**',
      grep: 'stack|api',
      context: 2,
      dungeonmasterCaller: {
        cwd: '/home/user/repo',
        sessionId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      },
    });
  });

  it('VALID: {sub-agent call} => adds the agentId too', () => {
    const hookData = McpPreToolUseHookDataStub({
      cwd: '/home/user/repo/worktrees/x' as never,
      tool_input: { agent: 'codeweaver-worker' },
      agent_id: 'a493e1c2168b46114' as never,
    });

    const result = mcpCallerUpdatedInputTransformer({ hookData });

    expect(result).toStrictEqual({
      agent: 'codeweaver-worker',
      dungeonmasterCaller: {
        cwd: '/home/user/repo/worktrees/x',
        sessionId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        agentId: 'a493e1c2168b46114',
      },
    });
  });

  it('EMPTY: {tool with no input} => returns the caller context alone', () => {
    const hookData = McpPreToolUseHookDataStub({ tool_input: {} });

    const result = mcpCallerUpdatedInputTransformer({ hookData });

    expect(result).toStrictEqual({
      dungeonmasterCaller: {
        cwd: '/home/user/repo',
        sessionId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      },
    });
  });

  it('EDGE: {input already carries a stale caller key} => replaces it with this call`s caller', () => {
    const hookData = McpPreToolUseHookDataStub({
      tool_input: {
        glob: 'x',
        dungeonmasterCaller: { cwd: '/elsewhere', sessionId: 'old' },
      },
    });

    const result = mcpCallerUpdatedInputTransformer({ hookData });

    expect(result).toStrictEqual({
      glob: 'x',
      dungeonmasterCaller: {
        cwd: '/home/user/repo',
        sessionId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      },
    });
  });
});
