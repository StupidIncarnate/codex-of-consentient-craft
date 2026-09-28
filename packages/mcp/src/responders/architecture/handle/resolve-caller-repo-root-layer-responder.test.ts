import { ResolveCallerRepoRootLayerResponder } from './resolve-caller-repo-root-layer-responder';
import { ResolveCallerRepoRootLayerResponderProxy } from './resolve-caller-repo-root-layer-responder.proxy';

const SERVER_CWD = '/repo/codex-of-consentient-craft';
const SESSION_ID = 'aaaaaaaa-1111-4222-9333-444444444444';

describe('ResolveCallerRepoRootLayerResponder', () => {
  it('VALID: {meta carries a hook caller in a worktree} => resolves that WORKTREE root, source caller-cwd', async () => {
    const proxy = ResolveCallerRepoRootLayerResponderProxy();
    const callerCwd = '/repo/codex-of-consentient-craft/worktrees/siegelense';
    proxy.setupServerCwd({ cwd: SERVER_CWD });
    proxy.setupRepoRootAtStart({ startPath: callerCwd });

    const result = await ResolveCallerRepoRootLayerResponder({
      meta: { 'dungeonmaster/caller': { cwd: callerCwd, sessionId: SESSION_ID } },
    });

    expect(result).toStrictEqual({ repoRoot: callerCwd, source: 'caller-cwd', configFound: true });
  });

  it('EMPTY: {meta undefined} => resolves the SERVER cwd, source server-cwd-fallback', async () => {
    const proxy = ResolveCallerRepoRootLayerResponderProxy();
    proxy.setupServerCwd({ cwd: SERVER_CWD });
    proxy.setupRepoRootAtStart({ startPath: SERVER_CWD });

    const result = await ResolveCallerRepoRootLayerResponder({ meta: undefined });

    expect(result).toStrictEqual({
      repoRoot: SERVER_CWD,
      source: 'server-cwd-fallback',
      configFound: true,
    });
  });
});
