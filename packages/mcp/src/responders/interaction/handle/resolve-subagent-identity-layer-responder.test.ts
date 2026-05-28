import { ResolveSubagentIdentityLayerResponder } from './resolve-subagent-identity-layer-responder';
import { ResolveSubagentIdentityLayerResponderProxy } from './resolve-subagent-identity-layer-responder.proxy';

const ACTIVE_MONITOR_SESSION_PATH = '/home/user/.dungeonmaster/active-monitor-session.json';

describe('ResolveSubagentIdentityLayerResponder', () => {
  it('VALID: {meta has toolUseId + cross-session scan finds match} => returns identity AND writes active-monitor-session.json', async () => {
    const proxy = ResolveSubagentIdentityLayerResponderProxy();
    proxy.setupCleanState();
    const parentSessionId = 'c2f964f7-31b7-4ac6-88f7-e7a985d8c671';
    const realAgentId = 'ad0775d7695b4d4eb';
    const toolUseId = 'toolu_01KfM8kWZATagwS33eTq5fZS';

    proxy.setupCwd({ path: '/home/user/proj' });
    proxy.setupHomeDir({ path: '/home/user' });
    proxy.setupDungeonmasterHome({
      homeDir: '/home/user',
      homePath: '/home/user/.dungeonmaster',
    });
    proxy.enqueueSessionsDir({ entries: [`${parentSessionId}.jsonl`] });
    proxy.enqueueSubagentsDir({ entries: [`agent-${realAgentId}.meta.json`] });
    proxy.enqueueMetaFileContents({
      contents: JSON.stringify({
        agentType: 'general-purpose',
        description: 'pathseeker-dedup dispatch',
        toolUseId,
      }),
    });

    const result = await ResolveSubagentIdentityLayerResponder({
      meta: { 'claudecode/toolUseId': toolUseId, progressToken: 3 },
    });

    expect(result).toStrictEqual({
      sessionId: parentSessionId,
      agentId: realAgentId,
    });

    // The first resolution in this process must write active-monitor-session.json so the
    // HTTP server reactor starts the JSONL watcher on the parent session. Content carries
    // a generated timestamp — assert path only via toStrictEqual on the mapped array.
    const writePaths = proxy.getAnnounceWrites().map((w) => w.path);

    expect(writePaths).toStrictEqual([ACTIVE_MONITOR_SESSION_PATH]);
  });

  it('EMPTY: {meta has no claudecode/toolUseId} => returns undefined, no announce', async () => {
    const proxy = ResolveSubagentIdentityLayerResponderProxy();
    proxy.setupCleanState();

    const result = await ResolveSubagentIdentityLayerResponder({ meta: { progressToken: 3 } });

    expect(result).toBe(undefined);
    expect(proxy.getAnnounceWrites()).toStrictEqual([]);
  });

  it('EMPTY: {meta absent} => returns undefined, no announce', async () => {
    const proxy = ResolveSubagentIdentityLayerResponderProxy();
    proxy.setupCleanState();

    const result = await ResolveSubagentIdentityLayerResponder({});

    expect(result).toBe(undefined);
    expect(proxy.getAnnounceWrites()).toStrictEqual([]);
  });

  it('EMPTY: {cross-session scan finds no match} => returns undefined, no announce', async () => {
    const proxy = ResolveSubagentIdentityLayerResponderProxy();
    proxy.setupCleanState();

    proxy.setupCwd({ path: '/home/user/proj' });
    proxy.setupHomeDir({ path: '/home/user' });
    proxy.setupDungeonmasterHome({
      homeDir: '/home/user',
      homePath: '/home/user/.dungeonmaster',
    });
    proxy.enqueueSessionsDirMissing();

    const result = await ResolveSubagentIdentityLayerResponder({
      meta: { 'claudecode/toolUseId': 'toolu_01KfM8kWZATagwS33eTq5fZS' },
    });

    expect(result).toBe(undefined);
    expect(proxy.getAnnounceWrites()).toStrictEqual([]);
  });

  it('VALID: {second call with same parent session} => returns identity, does NOT re-announce', async () => {
    const proxy = ResolveSubagentIdentityLayerResponderProxy();
    proxy.setupCleanState();
    const parentSessionId = 'c2f964f7-31b7-4ac6-88f7-e7a985d8c671';
    const realAgentId = 'ad0775d7695b4d4eb';
    const toolUseIdFirst = 'toolu_01KfM8kWZATagwS33eTq5fZS';
    const toolUseIdSecond = 'toolu_01ANOTHER_ToolUseId_99999';

    proxy.setupCwd({ path: '/home/user/proj' });
    proxy.setupHomeDir({ path: '/home/user' });
    proxy.setupDungeonmasterHome({
      homeDir: '/home/user',
      homePath: '/home/user/.dungeonmaster',
    });
    // First call setup
    proxy.enqueueSessionsDir({ entries: [`${parentSessionId}.jsonl`] });
    proxy.enqueueSubagentsDir({ entries: [`agent-${realAgentId}.meta.json`] });
    proxy.enqueueMetaFileContents({
      contents: JSON.stringify({
        agentType: 'general-purpose',
        description: 'first dispatch',
        toolUseId: toolUseIdFirst,
      }),
    });

    await ResolveSubagentIdentityLayerResponder({
      meta: { 'claudecode/toolUseId': toolUseIdFirst },
    });

    // Second call setup — different sub-agent, same parent session
    const secondAgentId = 'beefcafe1234567890';
    proxy.enqueueSessionsDir({ entries: [`${parentSessionId}.jsonl`] });
    proxy.enqueueSubagentsDir({ entries: [`agent-${secondAgentId}.meta.json`] });
    proxy.enqueueMetaFileContents({
      contents: JSON.stringify({
        agentType: 'general-purpose',
        description: 'second dispatch',
        toolUseId: toolUseIdSecond,
      }),
    });

    const result = await ResolveSubagentIdentityLayerResponder({
      meta: { 'claudecode/toolUseId': toolUseIdSecond },
    });

    expect(result).toStrictEqual({
      sessionId: parentSessionId,
      agentId: secondAgentId,
    });

    // Only ONE announce write total — the second call short-circuits via the latch.
    const writePaths = proxy.getAnnounceWrites().map((w) => w.path);

    expect(writePaths).toStrictEqual([ACTIVE_MONITOR_SESSION_PATH]);
  });
});
