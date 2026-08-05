import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { ToolUseIdStub } from '../../../contracts/tool-use-id/tool-use-id.stub';
import { claudeCodeSessionFindByToolUseIdBroker } from './claude-code-session-find-by-tool-use-id-broker';
import { claudeCodeSessionFindByToolUseIdBrokerProxy } from './claude-code-session-find-by-tool-use-id-broker.proxy';

const HOMEDIR = '/home/tester';
const PROJECT_DIR = '/repo/project';

// The shape Claude Code writes to a top-level `<sessionId>.jsonl` when the session emits an MCP
// tool_use — the very call this broker resolves back to its session.
const MATCHING_TOOL_USE_ID = 'toolu_01K6qfGEd8bFzkPvY8nHt1Ts';
const OTHER_TOOL_USE_ID = 'toolu_01ZZZZZZZZZZZZZZZZZZZZZZ';
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
const LINE_WITHOUT_MATCH = JSON.stringify({
  type: 'assistant',
  message: {
    role: 'assistant',
    content: [
      { type: 'tool_use', id: OTHER_TOOL_USE_ID, name: 'mcp__dungeonmaster__get-quest', input: {} },
    ],
  },
});

describe('claudeCodeSessionFindByToolUseIdBroker', () => {
  describe('deterministic match', () => {
    it('VALID: {toolUseId present in one session JSONL} => returns that session id', async () => {
      const proxy = claudeCodeSessionFindByToolUseIdBrokerProxy();

      proxy.setupSessions({
        homedir: HOMEDIR,
        projectDir: PROJECT_DIR,
        sessions: [
          { name: 'aaaaaaaa-1111-4222-9333-444444444444.jsonl', contents: '' },
          { name: 'bbbbbbbb-2222-4333-9444-555555555555.jsonl', contents: LINE_WITH_MATCH },
        ],
      });

      const result = await claudeCodeSessionFindByToolUseIdBroker({
        projectDir: AbsoluteFilePathStub({ value: PROJECT_DIR }),
        toolUseId: ToolUseIdStub({ value: MATCHING_TOOL_USE_ID }),
        attemptsLeft: 1,
      });

      expect(result).toBe('bbbbbbbb-2222-4333-9444-555555555555');
    });

    it('VALID: {another session JSONL that does NOT carry the toolUseId} => returns the matching session, not the other one', async () => {
      // This is the whole point of the deterministic path: with several Claude sessions open in
      // one repo, newest-mtime picks whichever wrote last, which need not be the caller.
      const proxy = claudeCodeSessionFindByToolUseIdBrokerProxy();

      proxy.setupSessions({
        homedir: HOMEDIR,
        projectDir: PROJECT_DIR,
        sessions: [
          { name: 'cccccccc-3333-4444-9555-666666666666.jsonl', contents: LINE_WITH_MATCH },
          { name: 'dddddddd-4444-4555-9666-777777777777.jsonl', contents: LINE_WITHOUT_MATCH },
        ],
      });

      const result = await claudeCodeSessionFindByToolUseIdBroker({
        projectDir: AbsoluteFilePathStub({ value: PROJECT_DIR }),
        toolUseId: ToolUseIdStub({ value: MATCHING_TOOL_USE_ID }),
        attemptsLeft: 1,
      });

      expect(result).toBe('cccccccc-3333-4444-9555-666666666666');
    });
  });

  describe('no match', () => {
    it('EMPTY: {no session JSONL carries the toolUseId} => returns undefined', async () => {
      const proxy = claudeCodeSessionFindByToolUseIdBrokerProxy();

      proxy.setupSessions({
        homedir: HOMEDIR,
        projectDir: PROJECT_DIR,
        sessions: [
          { name: 'eeeeeeee-5555-4666-9777-888888888888.jsonl', contents: LINE_WITHOUT_MATCH },
        ],
      });

      const result = await claudeCodeSessionFindByToolUseIdBroker({
        projectDir: AbsoluteFilePathStub({ value: PROJECT_DIR }),
        toolUseId: ToolUseIdStub({ value: MATCHING_TOOL_USE_ID }),
        attemptsLeft: 1,
      });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {sessions directory missing} => returns undefined', async () => {
      const proxy = claudeCodeSessionFindByToolUseIdBrokerProxy();

      proxy.setupSessionsDirMissing({ homedir: HOMEDIR, projectDir: PROJECT_DIR });

      const result = await claudeCodeSessionFindByToolUseIdBroker({
        projectDir: AbsoluteFilePathStub({ value: PROJECT_DIR }),
        toolUseId: ToolUseIdStub({ value: MATCHING_TOOL_USE_ID }),
        attemptsLeft: 1,
      });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {a non-JSONL entry sits alongside the sessions} => is not read as a session', async () => {
      const proxy = claudeCodeSessionFindByToolUseIdBrokerProxy();

      proxy.setupSessions({
        homedir: HOMEDIR,
        projectDir: PROJECT_DIR,
        sessions: [{ name: 'subagents', contents: LINE_WITH_MATCH }],
      });

      const result = await claudeCodeSessionFindByToolUseIdBroker({
        projectDir: AbsoluteFilePathStub({ value: PROJECT_DIR }),
        toolUseId: ToolUseIdStub({ value: MATCHING_TOOL_USE_ID }),
        attemptsLeft: 1,
      });

      expect(result).toBe(undefined);
    });
  });
});
