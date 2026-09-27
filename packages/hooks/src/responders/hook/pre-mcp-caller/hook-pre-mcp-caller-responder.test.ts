import { McpPreToolUseHookDataStub } from '../../../contracts/mcp-pre-tool-use-hook-data/mcp-pre-tool-use-hook-data.stub';
import { HookPreMcpCallerResponder } from './hook-pre-mcp-caller-responder';
import { HookPreMcpCallerResponderProxy } from './hook-pre-mcp-caller-responder.proxy';

describe('HookPreMcpCallerResponder', () => {
  it('VALID: {PreToolUse data for an MCP call} => returns the input with the caller context added', () => {
    HookPreMcpCallerResponderProxy();

    const result = HookPreMcpCallerResponder({
      input: McpPreToolUseHookDataStub({ tool_input: { packageName: 'mcp' } }),
    });

    expect(result).toStrictEqual({
      packageName: 'mcp',
      dungeonmasterCaller: {
        cwd: '/home/user/repo',
        sessionId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      },
    });
  });

  it('INVALID: {hook data with no cwd} => returns null so the call goes ahead unchanged', () => {
    HookPreMcpCallerResponderProxy();

    const result = HookPreMcpCallerResponder({
      input: {
        session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        hook_event_name: 'PreToolUse',
        tool_name: 'mcp__dungeonmaster__discover',
        tool_input: {},
      },
    });

    expect(result).toBe(null);
  });

  it('EMPTY: {input: null} => returns null', () => {
    HookPreMcpCallerResponderProxy();

    expect(HookPreMcpCallerResponder({ input: null })).toBe(null);
  });
});
