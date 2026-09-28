import { callerRepoRootResolveBroker } from './caller-repo-root-resolve-broker';
import { callerRepoRootResolveBrokerProxy } from './caller-repo-root-resolve-broker.proxy';

const SERVER_CWD = '/repo/codex-of-consentient-craft';
const SESSION_ID = 'aaaaaaaa-1111-4222-9333-444444444444';

describe('callerRepoRootResolveBroker', () => {
  describe('hook: the pre-MCP-caller hook stamped the caller onto the call', () => {
    it('VALID: {meta carries a hook caller in a worktree} => resolves from the WORKTREE', async () => {
      const proxy = callerRepoRootResolveBrokerProxy();
      const callerCwd = '/repo/codex-of-consentient-craft/worktrees/siegelense';
      proxy.setupServerCwd({ cwd: SERVER_CWD });
      proxy.setupRepoRootAtStart({ startPath: callerCwd });

      const result = await callerRepoRootResolveBroker({
        meta: { 'dungeonmaster/caller': { cwd: callerCwd, sessionId: SESSION_ID } },
      });

      expect(result).toStrictEqual({
        repoRoot: callerCwd,
        source: 'caller-cwd',
        configFound: true,
      });
    });

    it('VALID: {hook caller cwd with no .dungeonmaster.json above it} => returns that cwd with configFound: false', async () => {
      const proxy = callerRepoRootResolveBrokerProxy();
      proxy.setupServerCwd({ cwd: SERVER_CWD });
      proxy.setupRepoRootNotFound({ startPath: '/tmp/scratch' });

      const result = await callerRepoRootResolveBroker({
        meta: { 'dungeonmaster/caller': { cwd: '/tmp/scratch', sessionId: SESSION_ID } },
      });

      expect(result).toStrictEqual({
        repoRoot: '/tmp/scratch',
        source: 'caller-cwd',
        configFound: false,
      });
    });
  });

  describe('falls back to the server cwd, loudly labeled', () => {
    it('EMPTY: {meta is undefined} => resolves from the SERVER cwd, source: server-cwd-fallback', async () => {
      const proxy = callerRepoRootResolveBrokerProxy();
      proxy.setupServerCwd({ cwd: SERVER_CWD });
      proxy.setupRepoRootAtStart({ startPath: SERVER_CWD });

      const result = await callerRepoRootResolveBroker({ meta: undefined });

      expect(result).toStrictEqual({
        repoRoot: SERVER_CWD,
        source: 'server-cwd-fallback',
        configFound: true,
      });
    });

    it('EMPTY: {meta carries no caller context} => resolves from the SERVER cwd, source: server-cwd-fallback', async () => {
      const proxy = callerRepoRootResolveBrokerProxy();
      proxy.setupServerCwd({ cwd: SERVER_CWD });
      proxy.setupRepoRootAtStart({ startPath: SERVER_CWD });

      const result = await callerRepoRootResolveBroker({
        meta: { 'claudecode/toolUseId': 'toolu_01K6qfGEd8bFzkPvY8nHt1Ts' },
      });

      expect(result).toStrictEqual({
        repoRoot: SERVER_CWD,
        source: 'server-cwd-fallback',
        configFound: true,
      });
    });
  });

  describe('no .dungeonmaster.json found anywhere up the tree', () => {
    it('EDGE: {meta undefined, no config above the server cwd} => falls back to the LITERAL server cwd, configFound: false', async () => {
      const proxy = callerRepoRootResolveBrokerProxy();
      proxy.setupServerCwd({ cwd: SERVER_CWD });
      proxy.setupRepoRootNotFound({ startPath: SERVER_CWD });

      const result = await callerRepoRootResolveBroker({ meta: undefined });

      expect(result).toStrictEqual({
        repoRoot: SERVER_CWD,
        source: 'server-cwd-fallback',
        configFound: false,
      });
    });
  });
});
