import {
  FileNameStub,
  FilePathStub,
  ProcessIdStub,
  QuestIdStub,
  QuestWorkItemIdStub,
  SessionIdStub,
} from '@dungeonmaster/shared/contracts';

import { questMonitorJsonlWatcherBroker } from './quest-monitor-jsonl-watcher-broker';
import { questMonitorJsonlWatcherBrokerProxy } from './quest-monitor-jsonl-watcher-broker.proxy';

type QuestId = ReturnType<typeof QuestIdStub>;

const flushImmediate = async (): Promise<void> =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

describe('questMonitorJsonlWatcherBroker', () => {
  describe('main JSONL tail', () => {
    it('VALID: {assistant text line on main JSONL, active quest set} => emits tagged ChatEntry with active questId', async () => {
      const proxy = questMonitorJsonlWatcherBrokerProxy();
      const sessionFilePath = FilePathStub({
        value: '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl',
      });
      const chatProcessId = ProcessIdStub({ value: 'monitor-proc-1' });
      const activeQuestId = QuestIdStub({ value: 'add-auth' });

      proxy.setupSubagentDirEmpty();
      proxy.setupLines({
        lines: [
          '{"type":"assistant","uuid":"line-1","timestamp":"2026-05-13T10:00:01.000Z","message":{"content":[{"type":"text","text":"hello from main"}]}}',
        ],
      });

      const emitted: unknown[] = [];

      questMonitorJsonlWatcherBroker({
        sessionFilePath,
        activeQuestIdGetter: () => activeQuestId,
        chatProcessId,
        emit: (call) => {
          emitted.push(call);
        },
        isAgentIdActive: () => true,
      });

      proxy.triggerChange();
      await flushImmediate();

      expect(emitted).toStrictEqual([
        {
          chatProcessId,
          entries: [
            {
              role: 'assistant',
              type: 'text',
              content: 'hello from main',
              source: 'session',
              uuid: 'line-1:0',
              timestamp: '2026-05-13T10:00:01.000Z',
            },
          ],
          questId: activeQuestId,
        },
      ]);
    });

    it('VALID: {activeQuestIdGetter returns null} => emits ChatEntry with questId: null', async () => {
      const proxy = questMonitorJsonlWatcherBrokerProxy();
      const sessionFilePath = FilePathStub({
        value: '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl',
      });
      const chatProcessId = ProcessIdStub({ value: 'monitor-proc-2' });

      proxy.setupSubagentDirEmpty();
      proxy.setupLines({
        lines: [
          '{"type":"assistant","uuid":"line-2","timestamp":"2026-05-13T10:00:02.000Z","message":{"content":[{"type":"text","text":"idle chatter"}]}}',
        ],
      });

      const emitted: unknown[] = [];

      questMonitorJsonlWatcherBroker({
        sessionFilePath,
        activeQuestIdGetter: () => null,
        chatProcessId,
        emit: (call) => {
          emitted.push(call);
        },
        isAgentIdActive: () => true,
      });

      proxy.triggerChange();
      await flushImmediate();

      expect(emitted).toStrictEqual([
        {
          chatProcessId,
          entries: [
            {
              role: 'assistant',
              type: 'text',
              content: 'idle chatter',
              source: 'session',
              uuid: 'line-2:0',
              timestamp: '2026-05-13T10:00:02.000Z',
            },
          ],
          questId: null,
        },
      ]);
    });

    it('VALID: {two emissions with different active quest between them} => each batch tagged with the questId at its emit time', async () => {
      const proxy = questMonitorJsonlWatcherBrokerProxy();
      const sessionFilePath = FilePathStub({
        value: '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl',
      });
      const chatProcessId = ProcessIdStub({ value: 'monitor-proc-flip' });
      const questA = QuestIdStub({ value: 'quest-a' });
      const questB = QuestIdStub({ value: 'quest-b' });

      let activeQuest: QuestId | null = questA;

      proxy.setupSubagentDirEmpty();
      proxy.setupLines({
        lines: [
          '{"type":"assistant","uuid":"line-flip-1","timestamp":"2026-05-13T10:00:03.000Z","message":{"content":[{"type":"text","text":"during A"}]}}',
        ],
      });

      const emitted: unknown[] = [];

      questMonitorJsonlWatcherBroker({
        sessionFilePath,
        activeQuestIdGetter: () => activeQuest,
        chatProcessId,
        emit: (call) => {
          emitted.push(call);
        },
        isAgentIdActive: () => true,
      });

      proxy.triggerChange();
      await flushImmediate();

      // Flip the active quest BEFORE the next batch of lines lands.
      activeQuest = questB;

      proxy.setupLines({
        lines: [
          '{"type":"assistant","uuid":"line-flip-2","timestamp":"2026-05-13T10:00:04.000Z","message":{"content":[{"type":"text","text":"during B"}]}}',
        ],
      });
      proxy.triggerChange();
      await flushImmediate();

      expect(emitted).toStrictEqual([
        {
          chatProcessId,
          entries: [
            {
              role: 'assistant',
              type: 'text',
              content: 'during A',
              source: 'session',
              uuid: 'line-flip-1:0',
              timestamp: '2026-05-13T10:00:03.000Z',
            },
          ],
          questId: questA,
        },
        {
          chatProcessId,
          entries: [
            {
              role: 'assistant',
              type: 'text',
              content: 'during B',
              source: 'session',
              uuid: 'line-flip-2:0',
              timestamp: '2026-05-13T10:00:04.000Z',
            },
          ],
          questId: questB,
        },
      ]);
    });

    it('EMPTY: {subagents directory missing (ENOENT)} => watcher still starts, main JSONL emissions work', async () => {
      const proxy = questMonitorJsonlWatcherBrokerProxy();
      const sessionFilePath = FilePathStub({
        value: '/home/user/.claude/projects/-home-user-proj/no-subdir-session.jsonl',
      });
      const chatProcessId = ProcessIdStub({ value: 'monitor-proc-no-subdir' });
      const activeQuestId = QuestIdStub({ value: 'no-subdir-quest' });

      proxy.setupSubagentDirMissing({ error: new Error('ENOENT: no such directory') });
      proxy.setupLines({
        lines: [
          '{"type":"assistant","uuid":"line-3","timestamp":"2026-05-13T10:00:05.000Z","message":{"content":[{"type":"text","text":"only main"}]}}',
        ],
      });

      const emitted: unknown[] = [];

      questMonitorJsonlWatcherBroker({
        sessionFilePath,
        activeQuestIdGetter: () => activeQuestId,
        chatProcessId,
        emit: (call) => {
          emitted.push(call);
        },
        isAgentIdActive: () => true,
      });

      proxy.triggerChange();
      await flushImmediate();

      expect(emitted).toStrictEqual([
        {
          chatProcessId,
          entries: [
            {
              role: 'assistant',
              type: 'text',
              content: 'only main',
              source: 'session',
              uuid: 'line-3:0',
              timestamp: '2026-05-13T10:00:05.000Z',
            },
          ],
          questId: activeQuestId,
        },
      ]);
    });
  });

  describe('subagent JSONL tails', () => {
    it('VALID: {new agent-<id>.jsonl appears AFTER watcher start, before parent emits agent-detected} => poll-rescan tick starts sub-agent tail and emits its lines', async () => {
      const proxy = questMonitorJsonlWatcherBrokerProxy();
      const sessionFilePath = FilePathStub({
        value: '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl',
      });
      const chatProcessId = ProcessIdStub({ value: 'monitor-proc-late' });
      const activeQuestId = QuestIdStub({ value: 'quest-late-sub' });

      // Initial readdir during watcher startup: subagents/ is empty (sub-agent hasn't
      // started yet). Then the poll tick's readdir returns the late-appearing file.
      proxy.setupSubagentDirEmpty();
      proxy.setupSubagentDirFiles({
        files: [FileNameStub({ value: 'agent-late-1.jsonl' })],
      });
      // Main JSONL tail's initial drain: empty.
      proxy.setupLines({ lines: [] });
      // Sub-agent tail's first drain (started by the poll tick): one assistant-text line.
      proxy.setupLines({
        lines: [
          '{"type":"assistant","uuid":"sub-late-1","timestamp":"2026-05-13T10:00:10.000Z","message":{"content":[{"type":"text","text":"late from sub"}]}}',
        ],
      });

      const emitted: unknown[] = [];

      questMonitorJsonlWatcherBroker({
        sessionFilePath,
        activeQuestIdGetter: () => activeQuestId,
        chatProcessId,
        emit: (call) => {
          emitted.push(call);
        },
        isAgentIdActive: () => true,
      });

      // Fire the periodic poll-rescan registered with `timerSetIntervalAdapter`. The
      // broker should: rescan subagents/, see the new `agent-late-1.jsonl` file, start
      // a `fsWatchTailAdapter` on it. The synthetic-change emit from the adapter does
      // not fire the mocked watch callback, so the test fires `triggerChange()` below
      // to drain both watchers in registration order (main first → empty, subagent
      // second → late-1 line).
      proxy.triggerPollTick();
      proxy.triggerChange();
      await flushImmediate();

      expect(emitted).toStrictEqual([
        {
          chatProcessId,
          entries: [
            {
              role: 'assistant',
              type: 'text',
              content: 'late from sub',
              source: 'subagent',
              agentId: 'late-1',
              uuid: 'sub-late-1:0',
              timestamp: '2026-05-13T10:00:10.000Z',
            },
          ],
          questId: activeQuestId,
          sessionId: SessionIdStub({ value: 'abc-123' }),
        },
      ]);
    });

    it('VALID: {pre-existing agent-<id>.jsonl in subagents/} => sub-agent tail starts and emits its lines tagged with active questId', async () => {
      const proxy = questMonitorJsonlWatcherBrokerProxy();
      const sessionFilePath = FilePathStub({
        value: '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl',
      });
      const chatProcessId = ProcessIdStub({ value: 'monitor-proc-sub' });
      const activeQuestId = QuestIdStub({ value: 'quest-with-sub' });

      proxy.setupSubagentDirFiles({
        files: [FileNameStub({ value: 'agent-real-1.jsonl' })],
      });
      // Watchers are created in this order: (1) the sub-agent tail during initial scan,
      // (2) the main tail. Both share one fsWatchTailAdapter mock — the queue is FIFO,
      // and a single `triggerChange()` fires each watcher's callback once in registration
      // order. So batch[0] feeds the sub-agent's createReadStream, batch[1] feeds the main.
      proxy.setupLines({
        lines: [
          '{"type":"assistant","uuid":"sub-line-1","timestamp":"2026-05-13T10:00:06.000Z","message":{"content":[{"type":"text","text":"from sub"}]}}',
        ],
      });
      proxy.setupLines({ lines: [] });

      const emitted: unknown[] = [];

      questMonitorJsonlWatcherBroker({
        sessionFilePath,
        activeQuestIdGetter: () => activeQuestId,
        chatProcessId,
        emit: (call) => {
          emitted.push(call);
        },
        isAgentIdActive: () => true,
      });

      proxy.triggerChange();
      await flushImmediate();

      expect(emitted).toStrictEqual([
        {
          chatProcessId,
          entries: [
            {
              role: 'assistant',
              type: 'text',
              content: 'from sub',
              source: 'subagent',
              agentId: 'real-1',
              uuid: 'sub-line-1:0',
              timestamp: '2026-05-13T10:00:06.000Z',
            },
          ],
          questId: activeQuestId,
          // Parent session UUID derived from `monitorSession.sessionFilePath`'s basename
          // (abc-123.jsonl → abc-123). Stamped on every sub-agent emit so the web binding
          // buckets streaming frames under the same key chat-replay-responder uses and
          // get-agent-prompt's modify-quest stamps onto `wi.sessionId`.
          sessionId: SessionIdStub({ value: 'abc-123' }),
        },
      ]);
    });

    it('VALID: {nested sub-agent B spawned by sub-agent A, only A has a work item} => B emit carries A workItemId and parentAgentId stamped', async () => {
      const proxy = questMonitorJsonlWatcherBrokerProxy();
      const sessionFilePath = FilePathStub({
        value: '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl',
      });
      const chatProcessId = ProcessIdStub({ value: 'monitor-proc-nested' });
      const activeQuestId = QuestIdStub({ value: 'nested-ancestor-quest' });
      const wiA = QuestWorkItemIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      // Only sub-agent A has a work item, keyed on its realAgentId. Nested B is absent from
      // the map (its lookup returns undefined), so the broker must walk B -> A and route
      // B's transcript to A's work item.
      const workItemByAgent = new Map([['real-a', wiA]]);

      // tails come from agent-detected, not dir scan
      proxy.setupSubagentDirEmpty();

      // ROUND 1: main processes A_TOOLRESULT → registers real-a→toolu_chainA in processor
      // maps → emits agent-detected(real-a) → starts A's tail
      const A_TOOLRESULT =
        '{"type":"user","uuid":"a-result-1","timestamp":"2026-05-13T10:00:10.000Z","message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"toolu_chainA","content":"done"}]},"tool_use_result":{"agentId":"real-a","status":"completed"}}';

      // ROUND 2: A's tail processes B_TOOLRESULT → registers real-b→toolu_chainB +
      // parentChain[toolu_chainB]=toolu_chainA in processor maps → emits
      // agent-detected(real-b) → starts B's tail
      const B_TOOLRESULT =
        '{"type":"user","uuid":"b-result-1","timestamp":"2026-05-13T10:00:20.000Z","message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"toolu_chainB","content":"done"}]},"tool_use_result":{"agentId":"real-b","status":"completed"}}';

      // ROUND 3: B's tail processes B_TEXT → entry stamped parentAgentId=toolu_chainA →
      // emits with workItemId=wiA (ancestor walk: real-b→null→real-a→wiA)
      const B_TEXT =
        '{"type":"assistant","uuid":"b-text","timestamp":"2026-05-13T10:00:30.000Z","message":{"content":[{"type":"text","text":"nested B output"}]}}';

      const emitted: unknown[] = [];

      questMonitorJsonlWatcherBroker({
        sessionFilePath,
        activeQuestIdGetter: () => activeQuestId,
        chatProcessId,
        workItemIdForAgent: ({ agentId }) => workItemByAgent.get(String(agentId)),
        emit: (call) => {
          emitted.push(call);
        },
        isAgentIdActive: () => true,
      });

      // Round 1 — watcher order: [main]. main gets A_TOOLRESULT.
      proxy.setupLines({ lines: [A_TOOLRESULT] });
      proxy.triggerChange();
      await flushImmediate();

      // Round 2 — watcher order: [main, A-tail].
      // main gets empty; A-tail gets B_TOOLRESULT.
      proxy.setupLines({ lines: [] });
      proxy.setupLines({ lines: [B_TOOLRESULT] });
      proxy.triggerChange();
      await flushImmediate();

      // Round 3 — watcher order: [main, A-tail, B-tail].
      // main empty, A-tail empty, B-tail gets B_TEXT.
      proxy.setupLines({ lines: [] });
      proxy.setupLines({ lines: [] });
      proxy.setupLines({ lines: [B_TEXT] });
      proxy.triggerChange();
      await flushImmediate();

      // Three emits in causal order: main's A tool_result (no routing keys), A-tail's B
      // tool_result (routed to A's own work item wiA), then B-tail's text — the nested
      // entry carrying parentAgentId=toolu_chainA and routed to the ANCESTOR work item wiA.
      expect(emitted).toStrictEqual([
        {
          chatProcessId,
          entries: [
            {
              role: 'assistant',
              type: 'tool_result',
              toolName: 'toolu_chainA',
              content: 'done',
              source: 'session',
              uuid: 'a-result-1:0',
              timestamp: '2026-05-13T10:00:10.000Z',
            },
          ],
          questId: activeQuestId,
        },
        {
          chatProcessId,
          entries: [
            {
              role: 'assistant',
              type: 'tool_result',
              toolName: 'toolu_chainB',
              content: 'done',
              source: 'subagent',
              agentId: 'toolu_chainA',
              uuid: 'b-result-1:0',
              timestamp: '2026-05-13T10:00:20.000Z',
            },
          ],
          questId: activeQuestId,
          sessionId: SessionIdStub({ value: 'abc-123' }),
          workItemId: wiA,
        },
        {
          chatProcessId,
          entries: [
            {
              role: 'assistant',
              type: 'text',
              content: 'nested B output',
              source: 'subagent',
              agentId: 'toolu_chainB',
              parentAgentId: 'toolu_chainA',
              uuid: 'b-text:0',
              timestamp: '2026-05-13T10:00:30.000Z',
            },
          ],
          questId: activeQuestId,
          sessionId: SessionIdStub({ value: 'abc-123' }),
          workItemId: wiA,
        },
      ]);
    });

    it('VALID: {depth-1 sub-agent whose realAgentId has no work item and no ancestor} => emit omits workItemId (ancestor walk finds none)', async () => {
      const proxy = questMonitorJsonlWatcherBrokerProxy();
      const sessionFilePath = FilePathStub({
        value: '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl',
      });
      const chatProcessId = ProcessIdStub({ value: 'monitor-proc-no-wi' });
      const activeQuestId = QuestIdStub({ value: 'no-wi-quest' });
      // Resolver is supplied (seeded with an unrelated agent so the Map type infers), but the
      // depth-1 sub-agent X is absent from it and has no parent chain — so the walk bottoms
      // out at null and the emit carries no workItemId.
      const workItemByAgent = new Map([
        ['unrelated-agent', QuestWorkItemIdStub({ value: 'b2c3d4e5-58cc-4372-a567-0e02b2c3d480' })],
      ]);

      proxy.setupSubagentDirEmpty();

      const X_TOOLRESULT =
        '{"type":"user","uuid":"x-result","timestamp":"2026-05-13T10:00:40.000Z","message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"toolu_X","content":"done"}]},"tool_use_result":{"agentId":"real-x","status":"completed"}}';
      const X_TEXT =
        '{"type":"assistant","uuid":"x-text","timestamp":"2026-05-13T10:00:50.000Z","message":{"content":[{"type":"text","text":"depth1 X output"}]}}';

      const emitted: unknown[] = [];

      questMonitorJsonlWatcherBroker({
        sessionFilePath,
        activeQuestIdGetter: () => activeQuestId,
        chatProcessId,
        workItemIdForAgent: ({ agentId }) => workItemByAgent.get(String(agentId)),
        emit: (call) => {
          emitted.push(call);
        },
        isAgentIdActive: () => true,
      });

      // Round 1 — [main]: main gets X_TOOLRESULT → registers real-x→toolu_X, starts X's tail.
      proxy.setupLines({ lines: [X_TOOLRESULT] });
      proxy.triggerChange();
      await flushImmediate();

      // Round 2 — [main, X-tail]: main empty, X-tail gets X_TEXT.
      proxy.setupLines({ lines: [] });
      proxy.setupLines({ lines: [X_TEXT] });
      proxy.triggerChange();
      await flushImmediate();

      expect(emitted).toStrictEqual([
        {
          chatProcessId,
          entries: [
            {
              role: 'assistant',
              type: 'tool_result',
              toolName: 'toolu_X',
              content: 'done',
              source: 'session',
              uuid: 'x-result:0',
              timestamp: '2026-05-13T10:00:40.000Z',
            },
          ],
          questId: activeQuestId,
        },
        {
          chatProcessId,
          entries: [
            {
              role: 'assistant',
              type: 'text',
              content: 'depth1 X output',
              source: 'subagent',
              agentId: 'toolu_X',
              uuid: 'x-text:0',
              timestamp: '2026-05-13T10:00:50.000Z',
            },
          ],
          questId: activeQuestId,
          sessionId: SessionIdStub({ value: 'abc-123' }),
        },
      ]);
    });

    it('VALID: {agent-detected on main JSONL, isAgentIdActive returns false} => sub-agent tail not started, no sub-agent entries emitted', async () => {
      const proxy = questMonitorJsonlWatcherBrokerProxy();
      const sessionFilePath = FilePathStub({
        value: '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl',
      });
      const chatProcessId = ProcessIdStub({ value: 'monitor-proc-inactive-agent' });
      const activeQuestId = QuestIdStub({ value: 'inactive-agent-quest' });

      proxy.setupSubagentDirEmpty();

      // A tool_result line that normally triggers an agent-detected output — which causes
      // startSubagentTailLayerBroker to be called. With isAgentIdActive: () => false the
      // agent-detected handling is skipped (continue), so no sub-agent tail is registered.
      const TOOL_RESULT =
        '{"type":"user","uuid":"inactive-result","timestamp":"2026-05-13T10:01:00.000Z","message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"toolu_inactive","content":"done"}]},"tool_use_result":{"agentId":"real-inactive","status":"completed"}}';

      const emitted: unknown[] = [];

      questMonitorJsonlWatcherBroker({
        sessionFilePath,
        activeQuestIdGetter: () => activeQuestId,
        chatProcessId,
        emit: (call) => {
          emitted.push(call);
        },
        isAgentIdActive: () => false,
      });

      // Round 1: main tail processes TOOL_RESULT. The entries output is emitted; the
      // agent-detected output is skipped (isAgentIdActive: false). No sub-agent tail starts.
      proxy.setupLines({ lines: [TOOL_RESULT] });
      proxy.triggerChange();
      await flushImmediate();

      // Round 2: set up a batch that would be consumed by a sub-agent tail IF one had been
      // registered (it fires as the first watcher callback). Since no sub-agent tail exists,
      // only the main callback fires and consumes the single empty batch — the sub-agent
      // content batch is never touched and produces no emission.
      proxy.setupLines({ lines: [] }); // main: empty
      proxy.setupLines({
        lines: [
          '{"type":"assistant","uuid":"inactive-sub-line","timestamp":"2026-05-13T10:01:10.000Z","message":{"content":[{"type":"text","text":"should not appear"}]}}',
        ],
      }); // would only be consumed if a sub-agent tail existed
      proxy.triggerChange();
      await flushImmediate();

      // Only the tool_result entry from the main tail should appear.
      // No sub-agent entries because the tail was never started.
      expect(emitted).toStrictEqual([
        {
          chatProcessId,
          entries: [
            {
              role: 'assistant',
              type: 'tool_result',
              toolName: 'toolu_inactive',
              content: 'done',
              source: 'session',
              uuid: 'inactive-result:0',
              timestamp: '2026-05-13T10:01:00.000Z',
            },
          ],
          questId: activeQuestId,
        },
      ]);
    });
  });

  describe('pruneStaleTails()', () => {
    it('VALID: {agent becomes inactive} => stale tail handle stopped, no further emissions from it', async () => {
      const proxy = questMonitorJsonlWatcherBrokerProxy();
      const sessionFilePath = FilePathStub({
        value: '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl',
      });
      const chatProcessId = ProcessIdStub({ value: 'monitor-proc-prune-stale' });
      const activeQuestId = QuestIdStub({ value: 'prune-stale-quest' });

      let agentActive = true;

      // Pre-existing sub-agent in dir. Watcher registration order: sub-agent tail first
      // (initial scan), main tail second. So the first setupLines batch goes to the
      // sub-agent and the second goes to main.
      proxy.setupSubagentDirFiles({
        files: [FileNameStub({ value: 'agent-prune-1.jsonl' })],
      });
      proxy.setupLines({
        lines: [
          '{"type":"assistant","uuid":"pre-prune-line","timestamp":"2026-05-13T10:02:00.000Z","message":{"content":[{"type":"text","text":"before prune"}]}}',
        ],
      }); // sub-agent initial drain
      proxy.setupLines({ lines: [] }); // main initial drain

      const emitted: unknown[] = [];

      const handle = questMonitorJsonlWatcherBroker({
        sessionFilePath,
        activeQuestIdGetter: () => activeQuestId,
        chatProcessId,
        emit: (call) => {
          emitted.push(call);
        },
        isAgentIdActive: () => agentActive,
      });

      // Round 1: sub-agent emits its first line (before pruning).
      proxy.triggerChange();
      await flushImmediate();

      // Mark agent as inactive and prune. The sub-agent handle is stopped and removed from
      // the internal subagentHandles map.
      agentActive = false;
      handle.pruneStaleTails();

      // Round 2: the sub-agent's watch callback still fires (watchCallbacks is shared), but
      // the real adapter is stopped so it does not call createReadStream. We set up no new
      // batches — no queue item is consumed, no further emissions appear.
      proxy.triggerChange();
      await flushImmediate();

      expect(emitted).toStrictEqual([
        {
          chatProcessId,
          entries: [
            {
              role: 'assistant',
              type: 'text',
              content: 'before prune',
              source: 'subagent',
              agentId: 'prune-1',
              uuid: 'pre-prune-line:0',
              timestamp: '2026-05-13T10:02:00.000Z',
            },
          ],
          questId: activeQuestId,
          sessionId: SessionIdStub({ value: 'abc-123' }),
        },
      ]);
    });

    it('VALID: {all agents remain active} => no handles stopped, subsequent emissions continue', async () => {
      const proxy = questMonitorJsonlWatcherBrokerProxy();
      const sessionFilePath = FilePathStub({
        value: '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl',
      });
      const chatProcessId = ProcessIdStub({ value: 'monitor-proc-prune-active' });
      const activeQuestId = QuestIdStub({ value: 'prune-active-quest' });

      proxy.setupSubagentDirFiles({
        files: [FileNameStub({ value: 'agent-keep-1.jsonl' })],
      });
      proxy.setupLines({ lines: [] }); // sub-agent initial drain (empty)
      proxy.setupLines({ lines: [] }); // main initial drain (empty)

      const emitted: unknown[] = [];

      const handle = questMonitorJsonlWatcherBroker({
        sessionFilePath,
        activeQuestIdGetter: () => activeQuestId,
        chatProcessId,
        emit: (call) => {
          emitted.push(call);
        },
        isAgentIdActive: () => true,
      });

      proxy.triggerChange();
      await flushImmediate();

      // pruneStaleTails with all agents active: the if-branch is never taken → no-op.
      handle.pruneStaleTails();

      // Sub-agent tail is still alive; its next batch emits normally.
      proxy.setupLines({
        lines: [
          '{"type":"assistant","uuid":"keep-line-1","timestamp":"2026-05-13T10:02:20.000Z","message":{"content":[{"type":"text","text":"still alive"}]}}',
        ],
      }); // sub-agent second drain
      proxy.setupLines({ lines: [] }); // main second drain
      proxy.triggerChange();
      await flushImmediate();

      expect(emitted).toStrictEqual([
        {
          chatProcessId,
          entries: [
            {
              role: 'assistant',
              type: 'text',
              content: 'still alive',
              source: 'subagent',
              agentId: 'keep-1',
              uuid: 'keep-line-1:0',
              timestamp: '2026-05-13T10:02:20.000Z',
            },
          ],
          questId: activeQuestId,
          sessionId: SessionIdStub({ value: 'abc-123' }),
        },
      ]);
    });
  });

  describe('stop()', () => {
    it('VALID: {stop called} => subsequent change events emit nothing', async () => {
      const proxy = questMonitorJsonlWatcherBrokerProxy();
      const sessionFilePath = FilePathStub({
        value: '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl',
      });
      const chatProcessId = ProcessIdStub({ value: 'monitor-proc-stop' });
      const activeQuestId = QuestIdStub({ value: 'stop-quest' });

      proxy.setupSubagentDirEmpty();

      const emitted: unknown[] = [];

      const handle = questMonitorJsonlWatcherBroker({
        sessionFilePath,
        activeQuestIdGetter: () => activeQuestId,
        chatProcessId,
        emit: (call) => {
          emitted.push(call);
        },
        isAgentIdActive: () => true,
      });

      handle.stop();

      proxy.setupLines({
        lines: [
          '{"type":"assistant","uuid":"after-stop","timestamp":"2026-05-13T10:00:07.000Z","message":{"content":[{"type":"text","text":"too late"}]}}',
        ],
      });
      proxy.triggerChange();
      await flushImmediate();

      expect(emitted).toStrictEqual([]);
    });

    it('VALID: {stop called with active sub-agent handles} => sub-agent handles stopped alongside main, no further emissions', async () => {
      const proxy = questMonitorJsonlWatcherBrokerProxy();
      const sessionFilePath = FilePathStub({
        value: '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl',
      });
      const chatProcessId = ProcessIdStub({ value: 'monitor-proc-stop-with-subs' });
      const activeQuestId = QuestIdStub({ value: 'stop-with-subs-quest' });

      // Pre-existing sub-agent so subagentHandles is non-empty when stop() is called,
      // exercising the for-of loop over subagentHandles.values() in stop().
      proxy.setupSubagentDirFiles({
        files: [FileNameStub({ value: 'agent-stop-1.jsonl' })],
      });
      proxy.setupLines({ lines: [] }); // sub-agent initial drain
      proxy.setupLines({ lines: [] }); // main initial drain

      const emitted: unknown[] = [];

      const handle = questMonitorJsonlWatcherBroker({
        sessionFilePath,
        activeQuestIdGetter: () => activeQuestId,
        chatProcessId,
        emit: (call) => {
          emitted.push(call);
        },
        isAgentIdActive: () => true,
      });

      // Drain initial empty batches (establishes both watchers are registered).
      proxy.triggerChange();
      await flushImmediate();

      // Stop all handles: poll + main + every subagentHandles entry.
      handle.stop();

      // After stop, trigger change with no new batches queued. Both the sub-agent and main
      // callbacks fire but their adapters are stopped, so no createReadStream calls are made
      // and no lines are consumed or emitted.
      proxy.triggerChange();
      await flushImmediate();

      expect(emitted).toStrictEqual([]);
    });
  });
});
