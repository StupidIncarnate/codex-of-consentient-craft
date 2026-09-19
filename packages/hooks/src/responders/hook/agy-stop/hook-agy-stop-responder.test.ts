import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { subagentStopBlockMessageStatics } from '../../../statics/subagent-stop-block-message/subagent-stop-block-message-statics';
import { HookAgyStopResponder } from './hook-agy-stop-responder';
import { HookAgyStopResponderProxy } from './hook-agy-stop-responder.proxy';

describe('HookAgyStopResponder', () => {
  it('INVALID: {fullyIdle: false} => returns continue with background task message', async () => {
    HookAgyStopResponderProxy();
    const result = await HookAgyStopResponder({
      hookInput: {
        fullyIdle: false,
        transcriptPath: '/test/transcript.jsonl',
      },
    });

    expect(result).toStrictEqual({
      decision: 'continue',
      reason: subagentStopBlockMessageStatics.backgroundTaskMessage,
    });
  });

  it('VALID: {no transcriptPath} => returns stop', async () => {
    HookAgyStopResponderProxy();
    const result = await HookAgyStopResponder({
      hookInput: {
        fullyIdle: true,
      },
    });

    expect(result).toStrictEqual({
      decision: 'stop',
    });
  });

  it('VALID: {transcript read error} => returns stop', async () => {
    const proxy = HookAgyStopResponderProxy();
    const transcriptPath = FilePathStub({ value: '/test/transcript.jsonl' });
    proxy.setupReadError({ filePath: transcriptPath });

    const result = await HookAgyStopResponder({
      hookInput: {
        fullyIdle: true,
        transcriptPath,
      },
    });

    expect(result).toStrictEqual({
      decision: 'stop',
    });
  });

  it('INVALID: work-item agent without signal-back => returns continue with block message', async () => {
    const proxy = HookAgyStopResponderProxy();
    const transcriptPath = FilePathStub({ value: '/test/transcript.jsonl' });
    const transcript = JSON.stringify({
      tool_calls: [
        {
          name: 'get-agent-prompt',
          args: { workItemId: 'item-1' },
        },
      ],
    });
    proxy.setupTranscript({ filePath: transcriptPath, contents: transcript });

    const result = await HookAgyStopResponder({
      hookInput: {
        fullyIdle: true,
        transcriptPath,
      },
    });

    expect(result).toStrictEqual({
      decision: 'continue',
      reason: subagentStopBlockMessageStatics.blockMessage,
    });
  });

  it('VALID: work-item agent with signal-back => returns stop', async () => {
    const proxy = HookAgyStopResponderProxy();
    const transcriptPath = FilePathStub({ value: '/test/transcript.jsonl' });
    const transcript = `${JSON.stringify({
      tool_calls: [
        {
          name: 'get-agent-prompt',
          args: { workItemId: 'item-1' },
        },
      ],
    })}\n${JSON.stringify({
      tool_calls: [
        {
          name: 'signal-back',
          args: { status: 'done' },
        },
      ],
    })}`;
    proxy.setupTranscript({ filePath: transcriptPath, contents: transcript });

    const result = await HookAgyStopResponder({
      hookInput: {
        fullyIdle: true,
        transcriptPath,
      },
    });

    expect(result).toStrictEqual({
      decision: 'stop',
    });
  });

  it('VALID: minion agent (no workItemId) => returns stop', async () => {
    const proxy = HookAgyStopResponderProxy();
    const transcriptPath = FilePathStub({ value: '/test/transcript.jsonl' });
    const transcript = JSON.stringify({
      tool_calls: [
        {
          name: 'get-agent-prompt',
          args: {},
        },
      ],
    });
    proxy.setupTranscript({ filePath: transcriptPath, contents: transcript });

    const result = await HookAgyStopResponder({
      hookInput: {
        fullyIdle: true,
        transcriptPath,
      },
    });

    expect(result).toStrictEqual({
      decision: 'stop',
    });
  });

  it('VALID: {fullyIdle: false, transcript with invoke_subagent} => returns stop', async () => {
    const proxy = HookAgyStopResponderProxy();
    const transcriptPath = FilePathStub({ value: '/test/transcript.jsonl' });
    const transcript = JSON.stringify({
      tool_calls: [
        {
          name: 'invoke_subagent',
          args: { Subagents: [{ Role: 'Tester' }] },
        },
      ],
    });
    proxy.setupTranscript({ filePath: transcriptPath, contents: transcript });

    const result = await HookAgyStopResponder({
      hookInput: {
        fullyIdle: false,
        transcriptPath,
      },
    });

    expect(result).toStrictEqual({
      decision: 'stop',
    });
  });

  it('INVALID: {fullyIdle: false, transcript with no invoke_subagent} => returns continue with background task message', async () => {
    const proxy = HookAgyStopResponderProxy();
    const transcriptPath = FilePathStub({ value: '/test/transcript.jsonl' });
    const transcript = JSON.stringify({
      tool_calls: [
        {
          name: 'run_command',
          args: { CommandLine: 'npm test' },
        },
      ],
    });
    proxy.setupTranscript({ filePath: transcriptPath, contents: transcript });

    const result = await HookAgyStopResponder({
      hookInput: {
        fullyIdle: false,
        transcriptPath,
      },
    });

    expect(result).toStrictEqual({
      decision: 'continue',
      reason: subagentStopBlockMessageStatics.backgroundTaskMessage,
    });
  });

  it('VALID: work-item agent without signal-back on re-entry (executionNum > 1) => returns stop', async () => {
    const proxy = HookAgyStopResponderProxy();
    const transcriptPath = FilePathStub({ value: '/test/transcript.jsonl' });
    const transcript = JSON.stringify({
      tool_calls: [
        {
          name: 'get-agent-prompt',
          args: { workItemId: 'item-1' },
        },
      ],
    });
    proxy.setupTranscript({ filePath: transcriptPath, contents: transcript });

    const result = await HookAgyStopResponder({
      hookInput: {
        fullyIdle: true,
        transcriptPath,
        executionNum: 2,
      },
    });

    expect(result).toStrictEqual({
      decision: 'stop',
    });
  });

  it('VALID: empty or non-object input => returns stop', async () => {
    HookAgyStopResponderProxy();
    const result = await HookAgyStopResponder({
      hookInput: null,
    });

    expect(result).toStrictEqual({
      decision: 'stop',
    });
  });
});
