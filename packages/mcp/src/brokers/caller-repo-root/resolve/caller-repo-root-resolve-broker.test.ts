import { callerRepoRootResolveBroker } from './caller-repo-root-resolve-broker';
import { callerRepoRootResolveBrokerProxy } from './caller-repo-root-resolve-broker.proxy';

const SERVER_CWD = '/repo/codex-of-consentient-craft';
const HOMEDIR = '/home/tester';
const SESSION_ID = 'aaaaaaaa-1111-4222-9333-444444444444';
const TOOL_USE_ID = 'toolu_01K6qfGEd8bFzkPvY8nHt1Ts';

describe('callerRepoRootResolveBroker', () => {
  describe('warm: cached cursor already covers the caller', () => {
    it('VALID: {meta with matching toolUseId found in a CACHED file} => resolves from the WORKTREE, skipping the cold scan entirely', async () => {
      const proxy = callerRepoRootResolveBrokerProxy();
      const callerCwd = '/repo/codex-of-consentient-craft/worktrees/siegelense';
      const line = JSON.stringify({
        type: 'assistant',
        cwd: callerCwd,
        message: {
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: TOOL_USE_ID,
              name: 'mcp__dungeonmaster__get-project-inventory',
            },
          ],
        },
      });
      proxy.setupServerCwd({ cwd: SERVER_CWD });
      proxy.setupCachedEntryFile({ filepath: '/cached/session.jsonl', contents: line });
      proxy.setupRepoRootAtStart({ startPath: callerCwd });
      // No cold-scan staging at all — an unstaged readdir throws, so if the broker fell through
      // to the cold path anyway this test would fail with that error instead of a clean result.

      const result = await callerRepoRootResolveBroker({
        meta: { 'claudecode/toolUseId': TOOL_USE_ID },
        cachedEntries: [{ filepath: '/cached/session.jsonl' as never, offsetBytes: 0 as never }],
      });

      expect(result).toStrictEqual({
        repoRoot: callerCwd,
        source: 'caller-cwd',
        configFound: true,
        cursorUpdates: [{ filepath: '/cached/session.jsonl', offsetBytes: line.length }],
      });
    });
  });

  describe('cold: cache misses, JSONL scan resolves the caller', () => {
    it('VALID: {meta with matching toolUseId, cold scan finds the worktree cwd} => resolves the repo root from the WORKTREE, source: caller-cwd', async () => {
      const proxy = callerRepoRootResolveBrokerProxy();
      const callerCwd = '/repo/codex-of-consentient-craft/worktrees/siegelense';
      proxy.setupServerCwd({ cwd: SERVER_CWD });
      proxy.setupColdMatch({
        serverCwd: SERVER_CWD,
        homedir: HOMEDIR,
        sessionId: SESSION_ID,
        toolUseId: TOOL_USE_ID,
        callerCwd,
      });
      proxy.setupRepoRootAtStart({ startPath: callerCwd });

      const result = await callerRepoRootResolveBroker({
        meta: { 'claudecode/toolUseId': TOOL_USE_ID },
        cachedEntries: [],
      });

      expect(result).toStrictEqual({
        repoRoot: callerCwd,
        source: 'caller-cwd',
        configFound: true,
        cursorUpdates: result.cursorUpdates,
      });
    });
  });

  describe('falls back to the server cwd, loudly labeled', () => {
    it('EMPTY: {meta is undefined} => resolves from the SERVER cwd, source: server-cwd-fallback', async () => {
      const proxy = callerRepoRootResolveBrokerProxy();
      proxy.setupServerCwd({ cwd: SERVER_CWD });
      proxy.setupRepoRootAtStart({ startPath: SERVER_CWD });

      const result = await callerRepoRootResolveBroker({ meta: undefined, cachedEntries: [] });

      expect(result).toStrictEqual({
        repoRoot: SERVER_CWD,
        source: 'server-cwd-fallback',
        configFound: true,
        cursorUpdates: [],
      });
    });

    it('EMPTY: {meta carries a non-string toolUseId} => resolves from the SERVER cwd, source: server-cwd-fallback', async () => {
      const proxy = callerRepoRootResolveBrokerProxy();
      proxy.setupServerCwd({ cwd: SERVER_CWD });
      proxy.setupRepoRootAtStart({ startPath: SERVER_CWD });

      const result = await callerRepoRootResolveBroker({
        meta: { 'claudecode/toolUseId': 42 },
        cachedEntries: [],
      });

      expect(result).toStrictEqual({
        repoRoot: SERVER_CWD,
        source: 'server-cwd-fallback',
        configFound: true,
        cursorUpdates: [],
      });
    });

    it('EMPTY: {meta has a toolUseId, no cache, and the cold scan finds no match} => resolves from the SERVER cwd, source: server-cwd-fallback', async () => {
      const proxy = callerRepoRootResolveBrokerProxy();
      proxy.setupServerCwd({ cwd: SERVER_CWD });
      proxy.setupColdNoMatch({ serverCwd: SERVER_CWD, homedir: HOMEDIR });
      proxy.setupRepoRootAtStart({ startPath: SERVER_CWD });

      const result = await callerRepoRootResolveBroker({
        meta: { 'claudecode/toolUseId': TOOL_USE_ID },
        cachedEntries: [],
      });

      expect(result).toStrictEqual({
        repoRoot: SERVER_CWD,
        source: 'server-cwd-fallback',
        configFound: true,
        cursorUpdates: [],
      });
    });
  });

  describe('no .dungeonmaster.json found anywhere up the tree', () => {
    it('EDGE: {meta undefined, no config above the server cwd} => falls back to the LITERAL server cwd, configFound: false', async () => {
      const proxy = callerRepoRootResolveBrokerProxy();
      proxy.setupServerCwd({ cwd: SERVER_CWD });
      proxy.setupRepoRootNotFound({ startPath: SERVER_CWD });

      const result = await callerRepoRootResolveBroker({ meta: undefined, cachedEntries: [] });

      expect(result).toStrictEqual({
        repoRoot: SERVER_CWD,
        source: 'server-cwd-fallback',
        configFound: false,
        cursorUpdates: [],
      });
    });

    it('EDGE: {caller cwd resolved via cache, no config above it} => falls back to the LITERAL caller cwd, configFound: false', async () => {
      const proxy = callerRepoRootResolveBrokerProxy();
      const callerCwd = '/tmp/scratch-harness-dir';
      const line = JSON.stringify({
        type: 'assistant',
        cwd: callerCwd,
        message: {
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: TOOL_USE_ID,
              name: 'mcp__dungeonmaster__get-project-inventory',
            },
          ],
        },
      });
      proxy.setupServerCwd({ cwd: SERVER_CWD });
      proxy.setupCachedEntryFile({ filepath: '/cached/session.jsonl', contents: line });
      proxy.setupRepoRootNotFound({ startPath: callerCwd });

      const result = await callerRepoRootResolveBroker({
        meta: { 'claudecode/toolUseId': TOOL_USE_ID },
        cachedEntries: [{ filepath: '/cached/session.jsonl' as never, offsetBytes: 0 as never }],
      });

      expect(result).toStrictEqual({
        repoRoot: callerCwd,
        source: 'caller-cwd',
        configFound: false,
        cursorUpdates: [{ filepath: '/cached/session.jsonl', offsetBytes: line.length }],
      });
    });
  });
});
