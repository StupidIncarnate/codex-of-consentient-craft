import { CallerCwdScanCursorStub } from '../../../contracts/caller-cwd-scan-cursor/caller-cwd-scan-cursor.stub';
import { ToolUseIdStub } from '../../../contracts/tool-use-id/tool-use-id.stub';
import { claudeCodeCallerCwdScanCachedEntriesBroker } from './claude-code-caller-cwd-scan-cached-entries-broker';
import { claudeCodeCallerCwdScanCachedEntriesBrokerProxy } from './claude-code-caller-cwd-scan-cached-entries-broker.proxy';

const TOOL_USE_ID_1 = 'toolu_01AAAAAAAAAAAAAAAAAAAAAAAA';
const TOOL_USE_ID_2 = 'toolu_01BBBBBBBBBBBBBBBBBBBBBBBB';

const LINE_MAIN_CHECKOUT = JSON.stringify({
  type: 'assistant',
  cwd: '/repo/codex-of-consentient-craft',
  message: {
    role: 'assistant',
    content: [{ type: 'tool_use', id: TOOL_USE_ID_1, name: 'mcp__dungeonmaster__discover' }],
  },
});
const LINE_WORKTREE = JSON.stringify({
  type: 'assistant',
  cwd: '/repo/codex-of-consentient-craft/worktrees/siegelense',
  message: {
    role: 'assistant',
    content: [{ type: 'tool_use', id: TOOL_USE_ID_2, name: 'mcp__dungeonmaster__discover' }],
  },
});
const LINE_NO_MATCH = JSON.stringify({
  type: 'assistant',
  message: {
    role: 'assistant',
    content: [{ type: 'tool_use', id: 'toolu_UNRELATED', name: 'mcp__dungeonmaster__discover' }],
  },
});

describe('claudeCodeCallerCwdScanCachedEntriesBroker', () => {
  describe('no growth', () => {
    it('EMPTY: {cached offset already equals the file size} => reads nothing, returns undefined', async () => {
      const proxy = claudeCodeCallerCwdScanCachedEntriesBrokerProxy();
      proxy.setupFile({ filepath: '/a.jsonl', contents: LINE_MAIN_CHECKOUT });
      const entries = [
        CallerCwdScanCursorStub({
          filepath: '/a.jsonl' as never,
          offsetBytes: LINE_MAIN_CHECKOUT.length,
        }),
      ];

      const result = await claudeCodeCallerCwdScanCachedEntriesBroker({
        entries,
        toolUseId: ToolUseIdStub({ value: TOOL_USE_ID_1 }),
      });

      expect(result).toStrictEqual({ cwd: undefined, advancedEntries: [] });
    });
  });

  describe('growth with a match in the delta', () => {
    it('VALID: {file grew with a new line matching the toolUseId} => returns its cwd and advances the cursor to the new size', async () => {
      const proxy = claudeCodeCallerCwdScanCachedEntriesBrokerProxy();
      const grown = `${LINE_MAIN_CHECKOUT}\n${LINE_WORKTREE}`;
      proxy.setupFile({ filepath: '/a.jsonl', contents: grown });
      const entries = [
        CallerCwdScanCursorStub({
          filepath: '/a.jsonl' as never,
          offsetBytes: LINE_MAIN_CHECKOUT.length,
        }),
      ];

      const result = await claudeCodeCallerCwdScanCachedEntriesBroker({
        entries,
        toolUseId: ToolUseIdStub({ value: TOOL_USE_ID_2 }),
      });

      expect(result).toStrictEqual({
        cwd: '/repo/codex-of-consentient-craft/worktrees/siegelense',
        advancedEntries: [
          CallerCwdScanCursorStub({ filepath: '/a.jsonl' as never, offsetBytes: grown.length }),
        ],
      });
    });

    it('VALID: {a session moves from the main checkout into a worktree mid-session} => the SAME cached file, re-scanned for a NEW toolUseId, returns the NEW cwd instead of the stale one', async () => {
      // First call: cursor at offset 0, file contains only the main-checkout line — this is the
      // exact state before the session entered a worktree.
      const proxyBefore = claudeCodeCallerCwdScanCachedEntriesBrokerProxy();
      proxyBefore.setupFile({ filepath: '/session.jsonl', contents: LINE_MAIN_CHECKOUT });
      const beforeMove = await claudeCodeCallerCwdScanCachedEntriesBroker({
        entries: [CallerCwdScanCursorStub({ filepath: '/session.jsonl' as never, offsetBytes: 0 })],
        toolUseId: ToolUseIdStub({ value: TOOL_USE_ID_1 }),
      });

      expect(beforeMove).toStrictEqual({
        cwd: '/repo/codex-of-consentient-craft',
        advancedEntries: [
          CallerCwdScanCursorStub({
            filepath: '/session.jsonl' as never,
            offsetBytes: LINE_MAIN_CHECKOUT.length,
          }),
        ],
      });

      // Second call: the session moved into a worktree and issued a NEW tool call; the file
      // grew by one line. The cursor cached from the first call (offset = LINE_MAIN_CHECKOUT.length)
      // points past the old content, exactly what callerCwdScanCursorState would hold.
      const proxyAfter = claudeCodeCallerCwdScanCachedEntriesBrokerProxy();
      const grownAfterMove = `${LINE_MAIN_CHECKOUT}\n${LINE_WORKTREE}`;
      proxyAfter.setupFile({ filepath: '/session.jsonl', contents: grownAfterMove });

      const afterMove = await claudeCodeCallerCwdScanCachedEntriesBroker({
        entries: [
          CallerCwdScanCursorStub({
            filepath: '/session.jsonl' as never,
            offsetBytes: LINE_MAIN_CHECKOUT.length,
          }),
        ],
        toolUseId: ToolUseIdStub({ value: TOOL_USE_ID_2 }),
      });

      expect(afterMove.cwd).toBe('/repo/codex-of-consentient-craft/worktrees/siegelense');
    });
  });

  describe('growth with no match, falling through to the next entry', () => {
    it('VALID: {first entry grew but did not match, second entry matches} => advances the first, returns the second cwd', async () => {
      const proxy = claudeCodeCallerCwdScanCachedEntriesBrokerProxy();
      const grownNoMatch = `${LINE_NO_MATCH}\n${LINE_NO_MATCH}`;
      proxy.setupFile({ filepath: '/a.jsonl', contents: grownNoMatch });
      proxy.setupFile({ filepath: '/b.jsonl', contents: LINE_WORKTREE });
      const entries = [
        CallerCwdScanCursorStub({
          filepath: '/a.jsonl' as never,
          offsetBytes: LINE_NO_MATCH.length,
        }),
        CallerCwdScanCursorStub({ filepath: '/b.jsonl' as never, offsetBytes: 0 }),
      ];

      const result = await claudeCodeCallerCwdScanCachedEntriesBroker({
        entries,
        toolUseId: ToolUseIdStub({ value: TOOL_USE_ID_2 }),
      });

      expect(result).toStrictEqual({
        cwd: '/repo/codex-of-consentient-craft/worktrees/siegelense',
        advancedEntries: [
          CallerCwdScanCursorStub({
            filepath: '/a.jsonl' as never,
            offsetBytes: grownNoMatch.length,
          }),
          CallerCwdScanCursorStub({
            filepath: '/b.jsonl' as never,
            offsetBytes: LINE_WORKTREE.length,
          }),
        ],
      });
    });
  });

  describe('empty input', () => {
    it('EMPTY: {no cached entries} => returns undefined with no advances', async () => {
      claudeCodeCallerCwdScanCachedEntriesBrokerProxy();

      const result = await claudeCodeCallerCwdScanCachedEntriesBroker({
        entries: [],
        toolUseId: ToolUseIdStub({ value: TOOL_USE_ID_1 }),
      });

      expect(result).toStrictEqual({ cwd: undefined, advancedEntries: [] });
    });
  });
});
