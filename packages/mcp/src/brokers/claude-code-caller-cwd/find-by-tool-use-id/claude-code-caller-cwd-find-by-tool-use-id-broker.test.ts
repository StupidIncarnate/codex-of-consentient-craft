import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { ToolUseIdStub } from '../../../contracts/tool-use-id/tool-use-id.stub';
import { claudeCodeCallerCwdFindByToolUseIdBroker } from './claude-code-caller-cwd-find-by-tool-use-id-broker';
import { claudeCodeCallerCwdFindByToolUseIdBrokerProxy } from './claude-code-caller-cwd-find-by-tool-use-id-broker.proxy';

const HOMEDIR = '/home/tester';
const PROJECT_DIR = '/repo/project';
const MATCHING_TOOL_USE_ID = 'toolu_01K6qfGEd8bFzkPvY8nHt1Ts';

const LINE_WITH_CWD_SIEGELENSE = JSON.stringify({
  type: 'assistant',
  cwd: '/home/tester/repo/worktrees/siegelense',
  message: {
    role: 'assistant',
    content: [
      {
        type: 'tool_use',
        id: MATCHING_TOOL_USE_ID,
        name: 'mcp__dungeonmaster__get-project-inventory',
      },
    ],
  },
});
const LINE_WITH_CWD_OTHER = JSON.stringify({
  type: 'assistant',
  cwd: '/home/tester/repo/worktrees/other',
  message: {
    role: 'assistant',
    content: [
      {
        type: 'tool_use',
        id: MATCHING_TOOL_USE_ID,
        name: 'mcp__dungeonmaster__get-project-inventory',
      },
    ],
  },
});
const LINE_NO_MATCH = JSON.stringify({
  type: 'assistant',
  message: {
    role: 'assistant',
    content: [{ type: 'tool_use', id: 'toolu_UNRELATED', name: 'mcp__dungeonmaster__discover' }],
  },
});

describe('claudeCodeCallerCwdFindByToolUseIdBroker', () => {
  describe('top-level session match', () => {
    it('VALID: {one session, matching line} => returns its cwd and a cursor at the matching file', async () => {
      const proxy = claudeCodeCallerCwdFindByToolUseIdBrokerProxy();
      proxy.setupTopLevelSessions({
        homedir: HOMEDIR,
        projectDir: PROJECT_DIR,
        sessions: [
          {
            sessionId: 'aaaaaaaa-1111-4222-9333-444444444444',
            mtimeMs: 1000,
            contents: LINE_WITH_CWD_SIEGELENSE,
          },
        ],
      });

      const result = await claudeCodeCallerCwdFindByToolUseIdBroker({
        projectDir: AbsoluteFilePathStub({ value: PROJECT_DIR }),
        toolUseId: ToolUseIdStub({ value: MATCHING_TOOL_USE_ID }),
        attemptsLeft: 1,
      });

      expect(result).toStrictEqual({
        cwd: '/home/tester/repo/worktrees/siegelense',
        cursor: {
          filepath: `${HOMEDIR}/.claude/projects/-repo-project/aaaaaaaa-1111-4222-9333-444444444444.jsonl`,
          offsetBytes: LINE_WITH_CWD_SIEGELENSE.length,
        },
      });
    });

    it('VALID: {newest session has no match, an OLDER session does} => still finds it by falling through', async () => {
      const proxy = claudeCodeCallerCwdFindByToolUseIdBrokerProxy();
      proxy.setupTopLevelSessions({
        homedir: HOMEDIR,
        projectDir: PROJECT_DIR,
        sessions: [
          { sessionId: 'newest', mtimeMs: 5000, contents: LINE_NO_MATCH },
          { sessionId: 'oldest', mtimeMs: 1000, contents: LINE_WITH_CWD_OTHER },
        ],
      });
      proxy.setupSubagentsDirMissing({
        homedir: HOMEDIR,
        projectDir: PROJECT_DIR,
        sessionId: 'newest',
      });
      proxy.setupSubagentsDirMissing({
        homedir: HOMEDIR,
        projectDir: PROJECT_DIR,
        sessionId: 'oldest',
      });

      const result = await claudeCodeCallerCwdFindByToolUseIdBroker({
        projectDir: AbsoluteFilePathStub({ value: PROJECT_DIR }),
        toolUseId: ToolUseIdStub({ value: MATCHING_TOOL_USE_ID }),
        attemptsLeft: 1,
      });

      expect(result?.cwd).toBe('/home/tester/repo/worktrees/other');
    });
  });

  describe('sub-agent fallback', () => {
    it('VALID: {no top-level match, a sub-agent file matches} => returns its cwd', async () => {
      const proxy = claudeCodeCallerCwdFindByToolUseIdBrokerProxy();
      proxy.setupTopLevelSessions({
        homedir: HOMEDIR,
        projectDir: PROJECT_DIR,
        sessions: [{ sessionId: 'parent', mtimeMs: 1000, contents: LINE_NO_MATCH }],
      });
      proxy.setupSubagentFiles({
        homedir: HOMEDIR,
        projectDir: PROJECT_DIR,
        sessionId: 'parent',
        agents: [
          { agentFilename: 'agent-a.jsonl', mtimeMs: 2000, contents: LINE_WITH_CWD_SIEGELENSE },
        ],
      });

      const result = await claudeCodeCallerCwdFindByToolUseIdBroker({
        projectDir: AbsoluteFilePathStub({ value: PROJECT_DIR }),
        toolUseId: ToolUseIdStub({ value: MATCHING_TOOL_USE_ID }),
        attemptsLeft: 1,
      });

      expect(result?.cwd).toBe('/home/tester/repo/worktrees/siegelense');
    });
  });

  describe('no match', () => {
    it('EMPTY: {sessions dir missing} => returns undefined', async () => {
      const proxy = claudeCodeCallerCwdFindByToolUseIdBrokerProxy();
      proxy.setupSessionsDirMissing({ homedir: HOMEDIR, projectDir: PROJECT_DIR });

      const result = await claudeCodeCallerCwdFindByToolUseIdBroker({
        projectDir: AbsoluteFilePathStub({ value: PROJECT_DIR }),
        toolUseId: ToolUseIdStub({ value: MATCHING_TOOL_USE_ID }),
        attemptsLeft: 1,
      });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {no session or sub-agent file matches} => returns undefined', async () => {
      const proxy = claudeCodeCallerCwdFindByToolUseIdBrokerProxy();
      proxy.setupTopLevelSessions({
        homedir: HOMEDIR,
        projectDir: PROJECT_DIR,
        sessions: [{ sessionId: 'parent', mtimeMs: 1000, contents: LINE_NO_MATCH }],
      });
      proxy.setupSubagentsDirMissing({
        homedir: HOMEDIR,
        projectDir: PROJECT_DIR,
        sessionId: 'parent',
      });

      const result = await claudeCodeCallerCwdFindByToolUseIdBroker({
        projectDir: AbsoluteFilePathStub({ value: PROJECT_DIR }),
        toolUseId: ToolUseIdStub({ value: MATCHING_TOOL_USE_ID }),
        attemptsLeft: 1,
      });

      expect(result).toBe(undefined);
    });
  });
});
