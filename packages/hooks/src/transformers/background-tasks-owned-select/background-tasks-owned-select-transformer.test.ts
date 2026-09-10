import { backgroundTasksOwnedSelectTransformer } from './background-tasks-owned-select-transformer';
import { HookBackgroundTaskStub } from '../../contracts/hook-background-task/hook-background-task.stub';

// Every id and every sentence below is copied from a measured Claude Code 2.1.267 run: three
// sibling sub-agents each backgrounding one command (ids bpgbycntf, bea151ik3, by021g0b3) and a
// top-level session backgrounding one while its child and grandchild worked (id bopp2p21w).
const OWN_SHELL_ID = 'bpgbycntf';
const SIBLING_SHELL_ID = 'bea151ik3';
const OTHER_SIBLING_SHELL_ID = 'by021g0b3';
const PARENT_SHELL_ID = 'bopp2p21w';
const AUTO_BACKGROUNDED_SHELL_ID = 'bx0xqxz5t';
const OWN_AGENT_ID = 'abddefaa25f4cfa73';

const startedOwnShellTranscript = JSON.stringify({
  type: 'user',
  agentId: OWN_AGENT_ID,
  message: {
    role: 'user',
    content: [
      {
        type: 'tool_result',
        tool_use_id: 'toolu_01',
        content: `Command running in background with ID: ${OWN_SHELL_ID}. Output is being written to: /tmp/claude-1001/proj/session/tasks/${OWN_SHELL_ID}.output. You will be notified when it completes. To check interim output, use Read on that file path.`,
      },
    ],
  },
});

const autoBackgroundedTranscript = JSON.stringify({
  type: 'user',
  agentId: OWN_AGENT_ID,
  message: {
    role: 'user',
    content: [
      {
        type: 'tool_result',
        tool_use_id: 'toolu_02',
        content: `Command did not complete within its 15s timeout and was moved to the background (ID: ${AUTO_BACKGROUNDED_SHELL_ID}). Output is being written to: /tmp/claude-1001/proj/session/tasks/${AUTO_BACKGROUNDED_SHELL_ID}.output.`,
      },
    ],
  },
});

const startedNothingTranscript = JSON.stringify({
  type: 'assistant',
  agentId: 'a6766c5a70034d25a',
  message: { role: 'assistant', content: [{ type: 'text', text: 'Walk complete. NEXT: pass.' }] },
});

describe('backgroundTasksOwnedSelectTransformer', () => {
  describe('commands this agent started', () => {
    it('VALID: {own shell id present in the transcript} => returns that task', () => {
      const backgroundTasks = [
        HookBackgroundTaskStub({ id: OWN_SHELL_ID, type: 'shell', status: 'running' }),
      ];

      const result = backgroundTasksOwnedSelectTransformer({
        backgroundTasks,
        transcript: startedOwnShellTranscript,
      });

      expect(result).toStrictEqual([
        HookBackgroundTaskStub({ id: OWN_SHELL_ID, type: 'shell', status: 'running' }),
      ]);
    });

    it('VALID: {id printed by the auto-background wording} => returns that task', () => {
      const backgroundTasks = [
        HookBackgroundTaskStub({
          id: AUTO_BACKGROUNDED_SHELL_ID,
          type: 'shell',
          status: 'running',
        }),
      ];

      const result = backgroundTasksOwnedSelectTransformer({
        backgroundTasks,
        transcript: autoBackgroundedTranscript,
      });

      expect(result).toStrictEqual([
        HookBackgroundTaskStub({
          id: AUTO_BACKGROUNDED_SHELL_ID,
          type: 'shell',
          status: 'running',
        }),
      ]);
    });

    // A stop event lists the stopping agent itself under `subagent` with `id` equal to its own
    // `agent_id`, and every line of its transcript carries that same id — so ownership selects it,
    // and `type` in hasRunningBackgroundTaskGuard is what keeps it from blocking. Both halves are
    // load-bearing; drop either and an async-dispatched sub-agent wedges on itself.
    it('VALID: {own subagent entry, id on every transcript line} => returns that task', () => {
      const backgroundTasks = [
        HookBackgroundTaskStub({ id: OWN_AGENT_ID, type: 'subagent', status: 'running' }),
      ];

      const result = backgroundTasksOwnedSelectTransformer({
        backgroundTasks,
        transcript: startedOwnShellTranscript,
      });

      expect(result).toStrictEqual([
        HookBackgroundTaskStub({ id: OWN_AGENT_ID, type: 'subagent', status: 'running' }),
      ]);
    });
  });

  describe('commands somebody else started', () => {
    // THE WEDGE THIS TRANSFORMER EXISTS TO END. A sibling sub-agent's lane arrives in this agent's
    // own event, and the agent has no tool that can clear it.
    it('VALID: {a sibling sub-agent owns the only running shell} => returns []', () => {
      const backgroundTasks = [
        HookBackgroundTaskStub({ id: SIBLING_SHELL_ID, type: 'shell', status: 'running' }),
      ];

      const result = backgroundTasksOwnedSelectTransformer({
        backgroundTasks,
        transcript: startedNothingTranscript,
      });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {the top-level session owns the only running shell} => returns []', () => {
      const backgroundTasks = [
        HookBackgroundTaskStub({ id: PARENT_SHELL_ID, type: 'shell', status: 'running' }),
      ];

      const result = backgroundTasksOwnedSelectTransformer({
        backgroundTasks,
        transcript: startedNothingTranscript,
      });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {own shell beside two siblings shells} => returns only the own one', () => {
      const backgroundTasks = [
        HookBackgroundTaskStub({ id: SIBLING_SHELL_ID, type: 'shell', status: 'running' }),
        HookBackgroundTaskStub({ id: OWN_SHELL_ID, type: 'shell', status: 'running' }),
        HookBackgroundTaskStub({ id: OTHER_SIBLING_SHELL_ID, type: 'shell', status: 'running' }),
      ];

      const result = backgroundTasksOwnedSelectTransformer({
        backgroundTasks,
        transcript: startedOwnShellTranscript,
      });

      expect(result).toStrictEqual([
        HookBackgroundTaskStub({ id: OWN_SHELL_ID, type: 'shell', status: 'running' }),
      ]);
    });
  });

  describe('nothing to select from', () => {
    it('EMPTY: {backgroundTasks: []} => returns []', () => {
      const result = backgroundTasksOwnedSelectTransformer({
        backgroundTasks: [],
        transcript: startedOwnShellTranscript,
      });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {transcript: ""} => returns []', () => {
      const backgroundTasks = [
        HookBackgroundTaskStub({ id: OWN_SHELL_ID, type: 'shell', status: 'running' }),
      ];

      const result = backgroundTasksOwnedSelectTransformer({ backgroundTasks, transcript: '' });

      expect(result).toStrictEqual([]);
    });
  });
});
