import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import { claudePathSlugEncoderTransformer } from '@dungeonmaster/shared/transformers';

import { ResolveCallerRepoRootLayerResponder } from './resolve-caller-repo-root-layer-responder';
import { ResolveCallerRepoRootLayerResponderProxy } from './resolve-caller-repo-root-layer-responder.proxy';

const SERVER_CWD = '/repo/codex-of-consentient-craft';
const HOMEDIR = '/home/tester';
const SESSION_ID = 'aaaaaaaa-1111-4222-9333-444444444444';
const TOOL_USE_ID_1 = 'toolu_01AAAAAAAAAAAAAAAAAAAAAAAA';
const TOOL_USE_ID_2 = 'toolu_01BBBBBBBBBBBBBBBBBBBBBBBB';

const SESSIONS_DIR = String(
  claudePathSlugEncoderTransformer({
    homeDir: AbsoluteFilePathStub({ value: HOMEDIR }),
    projectPath: AbsoluteFilePathStub({ value: SERVER_CWD }),
  }),
);
const SESSION_FILEPATH = `${SESSIONS_DIR}/${SESSION_ID}.jsonl`;

describe('ResolveCallerRepoRootLayerResponder', () => {
  it('VALID: {a cold hit} => returns the resolved root AND persists a cursor into callerCwdScanCursorState', async () => {
    const proxy = ResolveCallerRepoRootLayerResponderProxy();
    const callerCwd = '/repo/codex-of-consentient-craft/worktrees/siegelense';
    proxy.setupServerCwd({ cwd: SERVER_CWD });
    proxy.setupColdMatch({
      serverCwd: SERVER_CWD,
      homedir: HOMEDIR,
      sessionId: SESSION_ID,
      toolUseId: TOOL_USE_ID_1,
      callerCwd,
    });
    proxy.setupRepoRootAtStart({ startPath: callerCwd });

    const result = await ResolveCallerRepoRootLayerResponder({
      meta: { 'claudecode/toolUseId': TOOL_USE_ID_1 },
    });

    expect(result).toStrictEqual({ repoRoot: callerCwd, source: 'caller-cwd', configFound: true });
  });

  it('VALID: {a session moves from the main checkout into a worktree between two calls} => the SECOND call resolves the NEW root, not the cached one', async () => {
    const proxy = ResolveCallerRepoRootLayerResponderProxy();
    proxy.setupServerCwd({ cwd: SERVER_CWD });

    // Call 1: resolved from the main checkout — this seeds the cursor cache via the cold scan.
    proxy.setupColdMatch({
      serverCwd: SERVER_CWD,
      homedir: HOMEDIR,
      sessionId: SESSION_ID,
      toolUseId: TOOL_USE_ID_1,
      callerCwd: SERVER_CWD,
    });
    proxy.setupRepoRootAtStart({ startPath: SERVER_CWD });
    const first = await ResolveCallerRepoRootLayerResponder({
      meta: { 'claudecode/toolUseId': TOOL_USE_ID_1 },
    });

    expect(first.repoRoot).toBe(SERVER_CWD);

    // Call 2: the same session's file grew with a NEW line pointing at a worktree. The cursor
    // persisted from call 1 makes this a WARM lookup — the cached-entries scan reads only that
    // new line, not the whole file, and must return the NEW cwd rather than the cached one.
    const worktreeCwd = '/repo/codex-of-consentient-craft/worktrees/siegelense';
    const firstLine = JSON.stringify({
      type: 'assistant',
      cwd: SERVER_CWD,
      message: {
        role: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: TOOL_USE_ID_1,
            name: 'mcp__dungeonmaster__get-project-inventory',
          },
        ],
      },
    });
    const secondLine = JSON.stringify({
      type: 'assistant',
      cwd: worktreeCwd,
      message: {
        role: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: TOOL_USE_ID_2,
            name: 'mcp__dungeonmaster__get-project-inventory',
          },
        ],
      },
    });
    proxy.setupCachedEntryFile({
      filepath: SESSION_FILEPATH,
      contents: `${firstLine}\n${secondLine}`,
    });
    proxy.setupRepoRootAtStart({ startPath: worktreeCwd });

    const second = await ResolveCallerRepoRootLayerResponder({
      meta: { 'claudecode/toolUseId': TOOL_USE_ID_2 },
    });

    expect(second.repoRoot).toBe(worktreeCwd);
  });
});
