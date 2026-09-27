import { ResolveSubagentIdentityLayerResponder } from './resolve-subagent-identity-layer-responder';
import { ResolveSubagentIdentityLayerResponderProxy } from './resolve-subagent-identity-layer-responder.proxy';

describe('ResolveSubagentIdentityLayerResponder', () => {
  it('VALID: {meta carries a hook caller with an agentId} => returns the parent session and agent id with no scan', async () => {
    const proxy = ResolveSubagentIdentityLayerResponderProxy();
    proxy.setupCwd({ path: '/home/user/proj' });
    // No scan staging: an unstaged readdir throws, so a fall-through to the scan fails this test.

    const result = await ResolveSubagentIdentityLayerResponder({
      meta: {
        'claudecode/toolUseId': 'toolu_011pw36EFwmLorR7MdaSDEQG',
        'dungeonmaster/caller': {
          cwd: '/home/user/proj/worktrees/x',
          sessionId: 'c2f964f7-31b7-4ac6-88f7-e7a985d8c671',
          agentId: 'ad0775d7695b4d4eb',
        },
      },
    });

    expect(result).toStrictEqual({
      sessionId: 'c2f964f7-31b7-4ac6-88f7-e7a985d8c671',
      agentId: 'ad0775d7695b4d4eb',
      cwd: '/home/user/proj',
    });
  });

  it('EMPTY: {meta carries a hook caller with no agentId} => returns undefined, since a top-level session is no sub-agent', async () => {
    ResolveSubagentIdentityLayerResponderProxy();

    const result = await ResolveSubagentIdentityLayerResponder({
      meta: {
        'claudecode/toolUseId': 'toolu_011pw36EFwmLorR7MdaSDEQG',
        'dungeonmaster/caller': {
          cwd: '/home/user/proj',
          sessionId: 'c2f964f7-31b7-4ac6-88f7-e7a985d8c671',
        },
      },
    });

    expect(result).toBe(undefined);
  });

  it('VALID: {meta has toolUseId + cross-session scan finds match} => returns identity', async () => {
    const proxy = ResolveSubagentIdentityLayerResponderProxy();
    const parentSessionId = 'c2f964f7-31b7-4ac6-88f7-e7a985d8c671';
    const realAgentId = 'ad0775d7695b4d4eb';
    const toolUseId = 'toolu_011pw36EFwmLorR7MdaSDEQG';

    proxy.setupCwd({ path: '/home/user/proj' });
    proxy.setupSessionsDir({
      homedir: '/home/user',
      projectDir: '/home/user/proj',
      sessionIds: [parentSessionId],
    });
    proxy.setupSubagentsDir({
      homedir: '/home/user',
      projectDir: '/home/user/proj',
      sessionId: parentSessionId,
      agentFilenames: [`agent-${realAgentId}.jsonl`],
    });
    proxy.setupAgentFile({
      homedir: '/home/user',
      projectDir: '/home/user/proj',
      sessionId: parentSessionId,
      agentFilename: `agent-${realAgentId}.jsonl`,
      contents: JSON.stringify({
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: toolUseId,
              name: 'mcp__dungeonmaster__get-agent-prompt',
              input: {},
            },
          ],
        },
      }),
    });

    const result = await ResolveSubagentIdentityLayerResponder({
      meta: { 'claudecode/toolUseId': toolUseId, progressToken: 3 },
    });

    expect(result).toStrictEqual({
      sessionId: parentSessionId,
      agentId: realAgentId,
      // The directory the scan searched and found the transcript in — the MCP child's own cwd, which
      // is the calling session's. Recorded so the read paths locate this session's JSONL without
      // re-deriving it from the quest, whose worktree may not be where this session ran.
      cwd: '/home/user/proj',
    });
  });

  it('EMPTY: {meta has no claudecode/toolUseId} => returns undefined', async () => {
    ResolveSubagentIdentityLayerResponderProxy();

    const result = await ResolveSubagentIdentityLayerResponder({ meta: { progressToken: 3 } });

    expect(result).toBe(undefined);
  });

  it('EMPTY: {meta absent} => returns undefined', async () => {
    ResolveSubagentIdentityLayerResponderProxy();

    const result = await ResolveSubagentIdentityLayerResponder({});

    expect(result).toBe(undefined);
  });

  it('EMPTY: {cross-session scan finds no match} => returns undefined', async () => {
    const proxy = ResolveSubagentIdentityLayerResponderProxy();

    proxy.setupCwd({ path: '/home/user/proj' });
    proxy.setupSessionsDirMissing({ homedir: '/home/user', projectDir: '/home/user/proj' });

    const result = await ResolveSubagentIdentityLayerResponder({
      meta: { 'claudecode/toolUseId': 'toolu_011pw36EFwmLorR7MdaSDEQG' },
    });

    expect(result).toBe(undefined);
  });
});
