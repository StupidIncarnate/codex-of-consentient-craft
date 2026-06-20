import { HookSubagentStopResponder } from './hook-subagent-stop-responder';
import { HookSubagentStopResponderProxy } from './hook-subagent-stop-responder.proxy';
import { SubagentStopHookDataStub } from '../../../contracts/subagent-stop-hook-data/subagent-stop-hook-data.stub';
import { subagentStopBlockMessageStatics } from '../../../statics/subagent-stop-block-message/subagent-stop-block-message-statics';

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
        input: { agent: 'codeweaver-minion', questId: 'q1' },
      },
    ],
  },
});

describe('HookSubagentStopResponder', () => {
  it('VALID: {work-item agent transcript without signal-back} => returns a block decision', async () => {
    const proxy = HookSubagentStopResponderProxy();
    proxy.setupTranscript({ contents: workItemAgentLine });

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
    proxy.setupTranscript({ contents: [workItemAgentLine, signalBackLine].join('\n') });

    const result = await HookSubagentStopResponder({ hookInput: SubagentStopHookDataStub() });

    expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
  });

  it('VALID: {minion transcript with no workItemId} => allows the stop', async () => {
    const proxy = HookSubagentStopResponderProxy();
    proxy.setupTranscript({ contents: minionLine });

    const result = await HookSubagentStopResponder({ hookInput: SubagentStopHookDataStub() });

    expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
  });

  it('VALID: {would-be block but stop_hook_active true} => allows the stop', async () => {
    const proxy = HookSubagentStopResponderProxy();
    proxy.setupTranscript({ contents: workItemAgentLine });

    const result = await HookSubagentStopResponder({
      hookInput: SubagentStopHookDataStub({ stop_hook_active: true }),
    });

    expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
  });

  it('ERROR: {transcript read fails} => allows the stop', async () => {
    const proxy = HookSubagentStopResponderProxy();
    proxy.setupReadError();

    const result = await HookSubagentStopResponder({ hookInput: SubagentStopHookDataStub() });

    expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
  });

  it('INVALID: {hookInput is not a SubagentStop event} => allows the stop', async () => {
    HookSubagentStopResponderProxy();

    const result = await HookSubagentStopResponder({ hookInput: { hook_event_name: 'Stop' } });

    expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
  });
});
