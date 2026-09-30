import { FileMissingErrorStub } from '#gateway/node/fs/file-missing-error/file-missing-error.stub';
import { FileNameStub } from '@dungeonmaster/shared/contracts/file-name/file-name.stub';
import { ProcessIdStub } from '@dungeonmaster/shared/contracts/process-id/process-id.stub';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts/quest-work-item-id/quest-work-item-id.stub';
import { SessionIdStub } from '@dungeonmaster/shared/contracts/session-id/session-id.stub';

import { questMonitorJsonlWatcherBroker } from './quest-monitor-jsonl-watcher-broker';
import { questMonitorJsonlWatcherBrokerProxy } from './quest-monitor-jsonl-watcher-broker.proxy';
import { setImmediate } from '#gateway/node/setImmediate';

type QuestId = ReturnType<typeof QuestIdStub>;

const flushImmediate = async (): Promise<void> =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

const MAIN_JSONL = '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl';
const SUBAGENTS_DIR = '/home/user/.claude/projects/-home-user-proj/abc-123/subagents';

describe('questMonitorJsonlWatcherBroker', () => {
  describe('main JSONL tail', () => {
    it('VALID: {assistant text line on main JSONL, active quest set} => emits tagged ChatEntry with active questId', async () => {
      const proxy = questMonitorJsonlWatcherBrokerProxy();
      const sessionFilePath = '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl';
      const chatProcessId = ProcessIdStub({ value: 'monitor-proc-1' });
      const activeQuestId = QuestIdStub({ value: 'add-auth' });

      proxy.setupSubagentDirEmpty();
      proxy.setupLines({
        path: MAIN_JSONL,
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
      });

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
      const sessionFilePath = '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl';
      const chatProcessId = ProcessIdStub({ value: 'monitor-proc-2' });

      proxy.setupSubagentDirEmpty();
      proxy.setupLines({
        path: MAIN_JSONL,
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
      });

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

    it('VALID: {main JSONL entry, mainSessionWorkItemId set (node worker)} => emit stamps sessionId + workItemId so the row renders live', async () => {
      const proxy = questMonitorJsonlWatcherBrokerProxy();
      const sessionFilePath = '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl';
      const chatProcessId = ProcessIdStub({ value: 'proc-worker-abc-123' });

      proxy.setupSubagentDirEmpty();
      proxy.setupLines({
        path: MAIN_JSONL,
        lines: [
          '{"type":"assistant","uuid":"worker-line","timestamp":"2026-05-13T10:00:03.000Z","message":{"content":[{"type":"text","text":"pathseeker reading files"}]}}',
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
        mainSessionWorkItemId: QuestWorkItemIdStub(),
      });

      await flushImmediate();

      expect(emitted).toStrictEqual([
        {
          chatProcessId,
          entries: [
            {
              role: 'assistant',
              type: 'text',
              content: 'pathseeker reading files',
              source: 'session',
              uuid: 'worker-line:0',
              timestamp: '2026-05-13T10:00:03.000Z',
            },
          ],
          questId: null,
          sessionId: SessionIdStub({ value: 'abc-123' }),
          workItemId: QuestWorkItemIdStub(),
        },
      ]);
    });

    it('VALID: {two emissions with different active quest between them} => each batch tagged with the questId at its emit time', async () => {
      const proxy = questMonitorJsonlWatcherBrokerProxy();
      const sessionFilePath = '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl';
      const chatProcessId = ProcessIdStub({ value: 'monitor-proc-flip' });
      const questA = QuestIdStub({ value: 'quest-a' });
      const questB = QuestIdStub({ value: 'quest-b' });

      let activeQuest: QuestId | null = questA;

      proxy.setupSubagentDirEmpty();
      proxy.setupLines({
        path: MAIN_JSONL,
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
      });

      await flushImmediate();

      // Flip the active quest BEFORE the next batch of lines lands.
      activeQuest = questB;

      proxy.setupLines({
        path: MAIN_JSONL,
        lines: [
          '{"type":"assistant","uuid":"line-flip-2","timestamp":"2026-05-13T10:00:04.000Z","message":{"content":[{"type":"text","text":"during B"}]}}',
        ],
      });
      proxy.triggerChange({ path: MAIN_JSONL });
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
      const sessionFilePath = '/home/user/.claude/projects/-home-user-proj/no-subdir-session.jsonl';
      const chatProcessId = ProcessIdStub({ value: 'monitor-proc-no-subdir' });
      const activeQuestId = QuestIdStub({ value: 'no-subdir-quest' });

      proxy.setupSubagentDirMissing({
        sessionFilePath,
        error: FileMissingErrorStub({ path: SUBAGENTS_DIR }),
      });
      proxy.setupLines({
        path: '/home/user/.claude/projects/-home-user-proj/no-subdir-session.jsonl',
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
      });

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

    it('VALID: {tailed main JSONL appends a user line whose content is A![Pasted Image 1](/p/x.png)B} => emitted entry content rewrites the pasted-image path to a server image URL', async () => {
      const proxy = questMonitorJsonlWatcherBrokerProxy();
      const sessionFilePath = '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl';
      const chatProcessId = ProcessIdStub({ value: 'monitor-proc-pasted-image' });
      const activeQuestId = QuestIdStub({ value: 'pasted-image-quest' });

      proxy.setupSubagentDirEmpty();
      proxy.setupLines({
        path: MAIN_JSONL,
        lines: [
          '{"type":"user","uuid":"paste-line","timestamp":"2026-05-13T10:00:08.000Z","message":{"role":"user","content":"A![Pasted Image 1](/p/x.png)B"}}',
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
      });

      await flushImmediate();

      expect(emitted).toStrictEqual([
        {
          chatProcessId,
          entries: [
            {
              role: 'user',
              content:
                'A![Pasted Image 1](http://dungeonmaster.localhost:3737/api/images?path=%2Fp%2Fx.png)B',
              source: 'session',
              uuid: 'paste-line:user',
              timestamp: '2026-05-13T10:00:08.000Z',
            },
          ],
          questId: activeQuestId,
        },
      ]);
    });
  });

  describe('subagent JSONL tails', () => {
    it('VALID: {new agent-<id>.jsonl appears AFTER watcher start, before parent emits agent-detected} => poll-rescan tick pairs it against the outstanding Task, starts the sub-agent tail and emits its lines', async () => {
      const proxy = questMonitorJsonlWatcherBrokerProxy();
      const sessionFilePath = '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl';
      const chatProcessId = ProcessIdStub({ value: 'monitor-proc-late' });
      const activeQuestId = QuestIdStub({ value: 'quest-late-sub' });

      // Initial readdir during watcher startup: subagents/ is empty (sub-agent hasn't
      // started yet). Then the poll tick's readdir returns the late-appearing file.
      proxy.setupSubagentDirEmpty();
      // Main JSONL tail's initial drain: a Task tool_use line, registering an outstanding
      // Task the poll-tick's prompt-pairing can match the late file against.
      proxy.setupLines({
        path: MAIN_JSONL,
        lines: [
          '{"type":"assistant","uuid":"late-task","timestamp":"2026-05-13T10:00:09.000Z","message":{"content":[{"type":"tool_use","id":"toolu_late","name":"Agent","input":{"prompt":"late slice prompt"}}]}}',
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
      });

      // The main tail drains its Task line as it starts, before the file appears — pairing reads
      // the processor's outstanding Tasks AS OF the poll tick, so registration must land first.
      await flushImmediate();

      proxy.setupSubagentDirFiles({
        files: [FileNameStub({ value: 'agent-late-1.jsonl' })],
      });
      proxy.setupFirstLineRead({
        content:
          '{"type":"user","uuid":"late-prompt-line","timestamp":"2026-05-13T10:00:09.500Z","message":{"role":"user","content":"late slice prompt"}}',
      });
      // The sub-agent tail's first drain (started by the poll tick): one assistant-text line.
      proxy.setupLines({
        path: `${SUBAGENTS_DIR}/agent-late-1.jsonl`,
        lines: [
          '{"type":"assistant","uuid":"sub-late-1","timestamp":"2026-05-13T10:00:10.000Z","message":{"content":[{"type":"text","text":"late from sub"}]}}',
        ],
      });

      // Fire the periodic poll-rescan registered with `timerIntervalStartBroker`. The
      // broker should: rescan subagents/, see the new `agent-late-1.jsonl` file, pair its
      // first line against the outstanding Task, and start a `tailFile` on it, which drains
      // its staged line as it starts.
      proxy.triggerPollTick();
      await flushImmediate();
      await flushImmediate();

      expect(emitted).toStrictEqual([
        {
          chatProcessId,
          entries: [
            {
              role: 'assistant',
              type: 'tool_use',
              toolName: 'Agent',
              toolInput: '{"prompt":"late slice prompt"}',
              toolUseId: 'toolu_late',
              source: 'session',
              agentId: 'toolu_late',
              uuid: 'late-task:0',
              timestamp: '2026-05-13T10:00:09.000Z',
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
              content: 'late from sub',
              source: 'subagent',
              agentId: 'toolu_late',
              uuid: 'sub-late-1:0',
              timestamp: '2026-05-13T10:00:10.000Z',
            },
          ],
          questId: activeQuestId,
          sessionId: SessionIdStub({ value: 'abc-123' }),
        },
      ]);
    });

    it('VALID: {pre-existing agent-<id>.jsonl in subagents/} => the initial scan cannot pair it (no outstanding Task yet); the next poll tick pairs it once the main tail has drained the Task line, and its lines emit tagged with active questId', async () => {
      const proxy = questMonitorJsonlWatcherBrokerProxy();
      const sessionFilePath = '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl';
      const chatProcessId = ProcessIdStub({ value: 'monitor-proc-sub' });
      const activeQuestId = QuestIdStub({ value: 'quest-with-sub' });

      // The file is on disk from the moment the watcher starts — but the processor has
      // registered no outstanding Task yet (the main tail hasn't drained anything), so the
      // broker's initial fire-and-forget scan reads the first line and finds no match.
      proxy.setupSubagentDirFiles({
        files: [FileNameStub({ value: 'agent-real-1.jsonl' })],
      });
      proxy.setupFirstLineRead({
        content:
          '{"type":"user","uuid":"sub-prompt-line","timestamp":"2026-05-13T10:00:05.500Z","message":{"role":"user","content":"real-1 slice prompt"}}',
      });
      // Main tail's first drain: the Task tool_use line whose prompt the pre-existing file's
      // first line matches — this is what the NEXT poll tick's pairing attempt needs.
      proxy.setupLines({
        path: MAIN_JSONL,
        lines: [
          '{"type":"assistant","uuid":"sub-task","timestamp":"2026-05-13T10:00:05.000Z","message":{"content":[{"type":"tool_use","id":"toolu_real1","name":"Agent","input":{"prompt":"real-1 slice prompt"}}]}}',
        ],
      });

      // Sub-agent tail's first drain (started once the poll tick pairs it): one assistant-text line.
      proxy.setupLines({
        path: `${SUBAGENTS_DIR}/agent-real-1.jsonl`,
        lines: [
          '{"type":"assistant","uuid":"sub-line-1","timestamp":"2026-05-13T10:00:06.000Z","message":{"content":[{"type":"text","text":"from sub"}]}}',
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
      });
      // The main tail's drain registers the outstanding Task the already-on-disk file could
      // not have matched at scan time.
      await flushImmediate();

      proxy.triggerPollTick();
      await flushImmediate();
      await flushImmediate();

      expect(emitted).toStrictEqual([
        {
          chatProcessId,
          entries: [
            {
              role: 'assistant',
              type: 'tool_use',
              toolName: 'Agent',
              toolInput: '{"prompt":"real-1 slice prompt"}',
              toolUseId: 'toolu_real1',
              source: 'session',
              agentId: 'toolu_real1',
              uuid: 'sub-task:0',
              timestamp: '2026-05-13T10:00:05.000Z',
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
              content: 'from sub',
              source: 'subagent',
              agentId: 'toolu_real1',
              uuid: 'sub-line-1:0',
              timestamp: '2026-05-13T10:00:06.000Z',
            },
          ],
          questId: activeQuestId,
          // Parent session UUID derived from `monitorSession.sessionFilePath`'s basename
          // (abc-123.jsonl → abc-123). Stamped on every sub-agent emit so the web binding
          // buckets streaming frames under the same key chat-replay-responder uses.
          sessionId: SessionIdStub({ value: 'abc-123' }),
        },
      ]);
    });

    it('VALID: {nested sub-agent B spawned by sub-agent A, only A has a work item} => B emit carries A workItemId and parentAgentId stamped', async () => {
      const proxy = questMonitorJsonlWatcherBrokerProxy();
      const sessionFilePath = '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl';
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

      proxy.setupLines({ path: MAIN_JSONL, lines: [A_TOOLRESULT] });
      proxy.setupLines({ path: `${SUBAGENTS_DIR}/agent-real-a.jsonl`, lines: [B_TOOLRESULT] });
      proxy.setupLines({ path: `${SUBAGENTS_DIR}/agent-real-b.jsonl`, lines: [B_TEXT] });

      const emitted: unknown[] = [];

      questMonitorJsonlWatcherBroker({
        sessionFilePath,
        activeQuestIdGetter: () => activeQuestId,
        chatProcessId,
        workItemIdForAgent: ({ agentId }) => workItemByAgent.get(String(agentId)),
        emit: (call) => {
          emitted.push(call);
        },
      });

      // Each tail drains its own file as it starts, and each drain starts the next tail: main
      // reads A_TOOLRESULT, A's tail reads B_TOOLRESULT, B's tail reads B_TEXT.
      await flushImmediate();
      await flushImmediate();
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
      const sessionFilePath = '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl';
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

      proxy.setupLines({ path: MAIN_JSONL, lines: [X_TOOLRESULT] });
      proxy.setupLines({ path: `${SUBAGENTS_DIR}/agent-real-x.jsonl`, lines: [X_TEXT] });

      const emitted: unknown[] = [];

      questMonitorJsonlWatcherBroker({
        sessionFilePath,
        activeQuestIdGetter: () => activeQuestId,
        chatProcessId,
        workItemIdForAgent: ({ agentId }) => workItemByAgent.get(String(agentId)),
        emit: (call) => {
          emitted.push(call);
        },
      });

      // main drains X_TOOLRESULT as it starts → registers real-x→toolu_X and starts X's tail,
      // which drains X_TEXT.
      await flushImmediate();
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
  });

  describe('stop()', () => {
    it('VALID: {stop called} => subsequent change events emit nothing', async () => {
      const proxy = questMonitorJsonlWatcherBrokerProxy();
      const sessionFilePath = '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl';
      const chatProcessId = ProcessIdStub({ value: 'monitor-proc-stop' });
      const activeQuestId = QuestIdStub({ value: 'stop-quest' });

      proxy.setupSubagentDirEmpty();
      proxy.setupFile({ path: MAIN_JSONL });

      const emitted: unknown[] = [];

      const handle = questMonitorJsonlWatcherBroker({
        sessionFilePath,
        activeQuestIdGetter: () => activeQuestId,
        chatProcessId,
        emit: (call) => {
          emitted.push(call);
        },
      });

      handle.stop();

      proxy.setupLines({
        path: MAIN_JSONL,
        lines: [
          '{"type":"assistant","uuid":"after-stop","timestamp":"2026-05-13T10:00:07.000Z","message":{"content":[{"type":"text","text":"too late"}]}}',
        ],
      });
      proxy.triggerChange({ path: MAIN_JSONL });
      await flushImmediate();

      expect(emitted).toStrictEqual([]);
    });

    it('VALID: {stop called with active sub-agent handles} => sub-agent handles stopped alongside main, no further emissions', async () => {
      const proxy = questMonitorJsonlWatcherBrokerProxy();
      const sessionFilePath = '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl';
      const chatProcessId = ProcessIdStub({ value: 'monitor-proc-stop-with-subs' });
      const activeQuestId = QuestIdStub({ value: 'stop-with-subs-quest' });
      const subagentJsonl = `${SUBAGENTS_DIR}/agent-stop-1.jsonl`;

      // A pre-existing sub-agent file whose first line pairs with the Task the main tail drains,
      // so subagentHandles is non-empty when stop() is called.
      proxy.setupSubagentDirFiles({
        files: [FileNameStub({ value: 'agent-stop-1.jsonl' })],
      });
      proxy.setupFirstLineRead({
        content:
          '{"type":"user","uuid":"stop-prompt-line","timestamp":"2026-05-13T10:00:06.500Z","message":{"role":"user","content":"stop slice prompt"}}',
      });
      proxy.setupLines({
        path: MAIN_JSONL,
        lines: [
          '{"type":"assistant","uuid":"stop-task","timestamp":"2026-05-13T10:00:06.000Z","message":{"content":[{"type":"tool_use","id":"toolu_stop1","name":"Agent","input":{"prompt":"stop slice prompt"}}]}}',
        ],
      });
      proxy.setupLines({ path: subagentJsonl, lines: [] });

      const emitted: unknown[] = [];

      const handle = questMonitorJsonlWatcherBroker({
        sessionFilePath,
        activeQuestIdGetter: () => activeQuestId,
        chatProcessId,
        emit: (call) => {
          emitted.push(call);
        },
      });

      // The main tail drains the Task line; the poll tick then pairs the sub-agent file and starts
      // its tail.
      await flushImmediate();
      proxy.triggerPollTick();
      await flushImmediate();
      await flushImmediate();

      // Stop all handles: poll + main + every subagentHandles entry.
      handle.stop();

      // After stop, both tails hear a change with new lines staged, but their watchers are
      // closed, so no lines are consumed or emitted beyond the Task entry drained before stop.
      proxy.setupLines({
        path: MAIN_JSONL,
        lines: [
          '{"type":"assistant","uuid":"after-stop-main","timestamp":"2026-05-13T10:00:07.000Z","message":{"content":[{"type":"text","text":"late main"}]}}',
        ],
      });
      proxy.setupLines({
        path: subagentJsonl,
        lines: [
          '{"type":"assistant","uuid":"after-stop-sub","timestamp":"2026-05-13T10:00:07.500Z","message":{"content":[{"type":"text","text":"late sub"}]}}',
        ],
      });
      proxy.triggerChange({ path: MAIN_JSONL });
      proxy.triggerChange({ path: subagentJsonl });
      await flushImmediate();

      expect(emitted).toStrictEqual([
        {
          chatProcessId,
          entries: [
            {
              role: 'assistant',
              type: 'tool_use',
              toolName: 'Agent',
              toolInput: '{"prompt":"stop slice prompt"}',
              toolUseId: 'toolu_stop1',
              source: 'session',
              agentId: 'toolu_stop1',
              uuid: 'stop-task:0',
              timestamp: '2026-05-13T10:00:06.000Z',
            },
          ],
          questId: activeQuestId,
        },
      ]);
    });
  });
});
