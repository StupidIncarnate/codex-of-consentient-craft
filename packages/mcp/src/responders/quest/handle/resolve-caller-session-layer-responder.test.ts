import { ResolveCallerSessionLayerResponder } from './resolve-caller-session-layer-responder';
import { ResolveCallerSessionLayerResponderProxy } from './resolve-caller-session-layer-responder.proxy';

// The responder resolves its own projectDir from processCwdAdapter and its homedir from
// osUserHomedirAdapter, so the staged readdir/readFile answers must be addressed at the sessions
// directory encoded from exactly that pair. Both are the adapters' STICKY defaults on purpose:
// `osUserHomedirAdapterProxy.returns` stages a one-shot, and the scan's retry loop calls
// homedir() once per pass — an overridden value would be consumed on the first pass and every
// later pass would encode a different directory than the answers are staged at.
const HOMEDIR = '/home/default';
const PROJECT_DIR = '/default/cwd';

const MATCHING_TOOL_USE_ID = 'toolu_01K6qfGEd8bFzkPvY8nHt1Ts';
const CALLER_SESSION = 'bbbbbbbb-2222-4333-9444-555555555555';
const NEWEST_SESSION = 'dddddddd-4444-4555-9666-777777777777';

const LINE_WITH_MATCH = JSON.stringify({
  type: 'assistant',
  message: {
    role: 'assistant',
    content: [
      {
        type: 'tool_use',
        id: MATCHING_TOOL_USE_ID,
        name: 'mcp__dungeonmaster__create-quest',
        input: {},
      },
    ],
  },
});

describe('ResolveCallerSessionLayerResponder', () => {
  describe('deterministic strategy', () => {
    it('VALID: {meta carries a toolUseId matching an older session} => returns that session, not the newest-mtime one', async () => {
      // The failure this prevents: two Claude sessions open in one repo, and the quest is stamped
      // with whichever wrote last rather than the one that ran the slash command.
      const proxy = ResolveCallerSessionLayerResponderProxy();

      proxy.setupSessions({
        homedir: HOMEDIR,
        projectDir: PROJECT_DIR,
        sessions: [
          { name: `${CALLER_SESSION}.jsonl`, contents: LINE_WITH_MATCH },
          { name: `${NEWEST_SESSION}.jsonl`, contents: '' },
        ],
        mtimeEntries: [
          { name: `${CALLER_SESSION}.jsonl`, mtimeMs: 1000 },
          { name: `${NEWEST_SESSION}.jsonl`, mtimeMs: 9000 },
        ],
      });

      const result = await ResolveCallerSessionLayerResponder({
        meta: { 'claudecode/toolUseId': MATCHING_TOOL_USE_ID },
      });

      expect(result).toBe(CALLER_SESSION);
    });
  });

  describe('newest-mtime fallback', () => {
    it('VALID: {no meta} => falls back to the newest-mtime session', async () => {
      const proxy = ResolveCallerSessionLayerResponderProxy();

      proxy.setupSessions({
        homedir: HOMEDIR,
        projectDir: PROJECT_DIR,
        sessions: [
          { name: `${CALLER_SESSION}.jsonl`, contents: LINE_WITH_MATCH },
          { name: `${NEWEST_SESSION}.jsonl`, contents: '' },
        ],
        mtimeEntries: [
          { name: `${CALLER_SESSION}.jsonl`, mtimeMs: 1000 },
          { name: `${NEWEST_SESSION}.jsonl`, mtimeMs: 9000 },
        ],
      });

      const result = await ResolveCallerSessionLayerResponder({ meta: undefined });

      expect(result).toBe(NEWEST_SESSION);
    });

    // Exhausts the scan's real flush-race retry budget (claudeSessionScanStatics: 30 × 100ms)
    // before falling through, so this case genuinely takes ~3s. The budget is a production
    // timing constant, not something to shrink for the test's convenience.
    it('VALID: {meta toolUseId matches no session JSONL} => falls back to the newest-mtime session', async () => {
      const proxy = ResolveCallerSessionLayerResponderProxy();

      proxy.setupSessions({
        homedir: HOMEDIR,
        projectDir: PROJECT_DIR,
        sessions: [
          { name: `${CALLER_SESSION}.jsonl`, contents: '' },
          { name: `${NEWEST_SESSION}.jsonl`, contents: '' },
        ],
        mtimeEntries: [
          { name: `${CALLER_SESSION}.jsonl`, mtimeMs: 1000 },
          { name: `${NEWEST_SESSION}.jsonl`, mtimeMs: 9000 },
        ],
      });

      const result = await ResolveCallerSessionLayerResponder({
        meta: { 'claudecode/toolUseId': MATCHING_TOOL_USE_ID },
      });

      expect(result).toBe(NEWEST_SESSION);
    }, 15_000);

    it('VALID: {meta toolUseId is not a string} => falls back to the newest-mtime session', async () => {
      const proxy = ResolveCallerSessionLayerResponderProxy();

      proxy.setupSessions({
        homedir: HOMEDIR,
        projectDir: PROJECT_DIR,
        sessions: [{ name: `${NEWEST_SESSION}.jsonl`, contents: '' }],
        mtimeEntries: [{ name: `${NEWEST_SESSION}.jsonl`, mtimeMs: 9000 }],
      });

      const result = await ResolveCallerSessionLayerResponder({
        meta: { 'claudecode/toolUseId': 42 },
      });

      expect(result).toBe(NEWEST_SESSION);
    });
  });
});
