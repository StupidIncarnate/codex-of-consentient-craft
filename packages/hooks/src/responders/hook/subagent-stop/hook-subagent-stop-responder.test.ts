import { HookSubagentStopResponder } from './hook-subagent-stop-responder';
import { HookSubagentStopResponderProxy } from './hook-subagent-stop-responder.proxy';
import { SubagentStopHookDataStub } from '../../../contracts/subagent-stop-hook-data/subagent-stop-hook-data.stub';
import { subagentStopBlockMessageStatics } from '../../../statics/subagent-stop-block-message/subagent-stop-block-message-statics';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { HookBackgroundTaskStub } from '../../../contracts/hook-background-task/hook-background-task.stub';

// HookSubagentStopResponder reads whichever of agent_transcript_path / transcript_path the hook
// input carries; every test below uses SubagentStopHookDataStub()'s default transcript_path, so
// the read is addressed by that same fixed path.
const TRANSCRIPT_PATH = FilePathStub({ value: '/tmp/transcript.jsonl' });

const workItemAgentLine = JSON.stringify({
  message: {
    role: 'assistant',
    content: [
      {
        type: 'tool_use',
        id: 't1',
        name: 'mcp__dungeonmaster__get-agent-prompt',
        input: { agent: 'codeweaver', questId: 'q1', workItemId: 'w1' },
      },
    ],
  },
});

const signalBackLine = JSON.stringify({
  message: {
    role: 'assistant',
    content: [
      {
        type: 'tool_use',
        id: 't2',
        name: 'mcp__dungeonmaster__signal-back',
        input: { questId: 'q1', workItemId: 'w1', signal: 'complete' },
      },
    ],
  },
});

const minionLine = JSON.stringify({
  message: {
    role: 'assistant',
    content: [
      {
        type: 'tool_use',
        id: 't1',
        name: 'mcp__dungeonmaster__get-agent-prompt',
        input: { agent: 'codeweaver-piece-minion', questId: 'q1' },
      },
    ],
  },
});

// `background_tasks` names no owner, so the responder decides ownership by finding the task's id
// in the stopping agent's own transcript. HookBackgroundTaskStub's default id is `bcibjy15w`; this
// line is the harness's own Bash result text, verbatim from a measured run, carrying that id.
const startedOwnShellLine = JSON.stringify({
  message: {
    role: 'user',
    content: [
      {
        type: 'tool_result',
        tool_use_id: 't0',
        content:
          'Command running in background with ID: bcibjy15w. Output is being written to: /tmp/claude-1001/proj/session/tasks/bcibjy15w.output. You will be notified when it completes.',
      },
    ],
  },
});

describe('HookSubagentStopResponder', () => {
  it('VALID: {minion transcript but a running command it started} => blocks, because the ban is not scoped to work-item agents', async () => {
    const proxy = HookSubagentStopResponderProxy();
    proxy.setupTranscript({
      filePath: TRANSCRIPT_PATH,
      contents: [minionLine, startedOwnShellLine].join('\n'),
    });

    const result = await HookSubagentStopResponder({
      hookInput: SubagentStopHookDataStub({
        background_tasks: [HookBackgroundTaskStub({ status: 'running' })],
      }),
    });

    expect(result).toStrictEqual({
      stdout: JSON.stringify({
        decision: 'block',
        reason: subagentStopBlockMessageStatics.backgroundTaskMessage,
      }),
      stderr: '',
      exitCode: 0,
    });
  });

  it('VALID: {running command it started and stop_hook_active true} => still blocks, unlike the signal-back nudge', async () => {
    const proxy = HookSubagentStopResponderProxy();
    proxy.setupTranscript({
      filePath: TRANSCRIPT_PATH,
      contents: [minionLine, startedOwnShellLine].join('\n'),
    });

    const result = await HookSubagentStopResponder({
      hookInput: SubagentStopHookDataStub({
        stop_hook_active: true,
        background_tasks: [HookBackgroundTaskStub({ status: 'running' })],
      }),
    });

    expect(result).toStrictEqual({
      stdout: JSON.stringify({
        decision: 'block',
        reason: subagentStopBlockMessageStatics.backgroundTaskMessage,
      }),
      stderr: '',
      exitCode: 0,
    });
  });

  // AN ASYNC-DISPATCHED SUB-AGENT IS LISTED AS ITS OWN RUNNING `subagent` TASK, so blocking on that
  // entry wedges it: nothing it can do clears its own id, and the block repeats forever.
  it('VALID: {running subagent task, minion transcript} => allows the stop rather than wedging the agent', async () => {
    const proxy = HookSubagentStopResponderProxy();
    proxy.setupTranscript({ filePath: TRANSCRIPT_PATH, contents: minionLine });

    const result = await HookSubagentStopResponder({
      hookInput: SubagentStopHookDataStub({
        background_tasks: [
          HookBackgroundTaskStub({ id: 'a4a98a1e1fbe45b1c', type: 'subagent', status: 'running' }),
        ],
      }),
    });

    expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
  });

  // PARALLEL SIBLINGS. Measured: three sub-agents dispatched in one message each backgrounded one
  // command, and every one of the three read all three shells in its own SubagentStop event. An
  // unscoped refusal holds every sibling open on lanes it cannot reach.
  it('VALID: {running shells a sibling sub-agent started} => allows the stop', async () => {
    const proxy = HookSubagentStopResponderProxy();
    proxy.setupTranscript({ filePath: TRANSCRIPT_PATH, contents: minionLine });

    const result = await HookSubagentStopResponder({
      hookInput: SubagentStopHookDataStub({
        background_tasks: [
          HookBackgroundTaskStub({ id: 'bea151ik3', type: 'shell', status: 'running' }),
          HookBackgroundTaskStub({ id: 'by021g0b3', type: 'shell', status: 'running' }),
        ],
      }),
    });

    expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
  });

  // PARENT'S COMMAND. Measured: a top-level session backgrounded one command and then dispatched a
  // child and a grandchild; that one shell appeared in both of their stop events, and neither had
  // started anything.
  it('VALID: {running shell the top-level session started} => allows the stop', async () => {
    const proxy = HookSubagentStopResponderProxy();
    proxy.setupTranscript({ filePath: TRANSCRIPT_PATH, contents: minionLine });

    const result = await HookSubagentStopResponder({
      hookInput: SubagentStopHookDataStub({
        background_tasks: [
          HookBackgroundTaskStub({ id: 'bopp2p21w', type: 'shell', status: 'running' }),
        ],
      }),
    });

    expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
  });

  it('VALID: {own running shell beside two siblings shells} => blocks on its own', async () => {
    const proxy = HookSubagentStopResponderProxy();
    proxy.setupTranscript({
      filePath: TRANSCRIPT_PATH,
      contents: [minionLine, startedOwnShellLine].join('\n'),
    });

    const result = await HookSubagentStopResponder({
      hookInput: SubagentStopHookDataStub({
        background_tasks: [
          HookBackgroundTaskStub({ id: 'bea151ik3', type: 'shell', status: 'running' }),
          HookBackgroundTaskStub({ status: 'running' }),
          HookBackgroundTaskStub({ id: 'by021g0b3', type: 'shell', status: 'running' }),
        ],
      }),
    });

    expect(result).toStrictEqual({
      stdout: JSON.stringify({
        decision: 'block',
        reason: subagentStopBlockMessageStatics.backgroundTaskMessage,
      }),
      stderr: '',
      exitCode: 0,
    });
  });

  // Ownership is unanswerable with no transcript, and the two mistakes cost differently: a needless
  // refusal costs one re-entry, a missed one costs the command.
  it('ERROR: {transcript read fails while a shell runs} => blocks, because ownership cannot be ruled out', async () => {
    const proxy = HookSubagentStopResponderProxy();
    proxy.setupReadError({ filePath: TRANSCRIPT_PATH });

    const result = await HookSubagentStopResponder({
      hookInput: SubagentStopHookDataStub({
        background_tasks: [HookBackgroundTaskStub({ status: 'running' })],
      }),
    });

    expect(result).toStrictEqual({
      stdout: JSON.stringify({
        decision: 'block',
        reason: subagentStopBlockMessageStatics.backgroundTaskMessage,
      }),
      stderr: '',
      exitCode: 0,
    });
  });

  it('VALID: {every background task completed, minion transcript} => allows the stop', async () => {
    const proxy = HookSubagentStopResponderProxy();
    proxy.setupTranscript({ filePath: TRANSCRIPT_PATH, contents: minionLine });

    const result = await HookSubagentStopResponder({
      hookInput: SubagentStopHookDataStub({
        background_tasks: [HookBackgroundTaskStub({ status: 'completed' })],
      }),
    });

    expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
  });

  it('VALID: {running command it started on a work-item agent} => reports the background task, not the missing signal-back', async () => {
    const proxy = HookSubagentStopResponderProxy();
    proxy.setupTranscript({
      filePath: TRANSCRIPT_PATH,
      contents: [workItemAgentLine, startedOwnShellLine].join('\n'),
    });

    const result = await HookSubagentStopResponder({
      hookInput: SubagentStopHookDataStub({
        background_tasks: [HookBackgroundTaskStub({ status: 'running' })],
      }),
    });

    expect(result).toStrictEqual({
      stdout: JSON.stringify({
        decision: 'block',
        reason: subagentStopBlockMessageStatics.backgroundTaskMessage,
      }),
      stderr: '',
      exitCode: 0,
    });
  });

  it('VALID: {work-item agent transcript without signal-back} => returns a block decision', async () => {
    const proxy = HookSubagentStopResponderProxy();
    proxy.setupTranscript({ filePath: TRANSCRIPT_PATH, contents: workItemAgentLine });

    const result = await HookSubagentStopResponder({ hookInput: SubagentStopHookDataStub() });

    expect(result).toStrictEqual({
      stdout: JSON.stringify({
        decision: 'block',
        reason: subagentStopBlockMessageStatics.blockMessage,
      }),
      stderr: '',
      exitCode: 0,
    });
  });

  it('VALID: {work-item agent that called signal-back} => allows the stop', async () => {
    const proxy = HookSubagentStopResponderProxy();
    proxy.setupTranscript({
      filePath: TRANSCRIPT_PATH,
      contents: [workItemAgentLine, signalBackLine].join('\n'),
    });

    const result = await HookSubagentStopResponder({ hookInput: SubagentStopHookDataStub() });

    expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
  });

  it('VALID: {minion transcript with no workItemId} => allows the stop', async () => {
    const proxy = HookSubagentStopResponderProxy();
    proxy.setupTranscript({ filePath: TRANSCRIPT_PATH, contents: minionLine });

    const result = await HookSubagentStopResponder({ hookInput: SubagentStopHookDataStub() });

    expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
  });

  it('VALID: {would-be block but stop_hook_active true} => allows the stop', async () => {
    const proxy = HookSubagentStopResponderProxy();
    proxy.setupTranscript({ filePath: TRANSCRIPT_PATH, contents: workItemAgentLine });

    const result = await HookSubagentStopResponder({
      hookInput: SubagentStopHookDataStub({ stop_hook_active: true }),
    });

    expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
  });

  it('ERROR: {transcript read fails} => allows the stop', async () => {
    const proxy = HookSubagentStopResponderProxy();
    proxy.setupReadError({ filePath: TRANSCRIPT_PATH });

    const result = await HookSubagentStopResponder({ hookInput: SubagentStopHookDataStub() });

    expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
  });

  it('INVALID: {hookInput is not a SubagentStop event} => allows the stop', async () => {
    HookSubagentStopResponderProxy();

    const result = await HookSubagentStopResponder({ hookInput: { hook_event_name: 'Stop' } });

    expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
  });
});
