import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { subagentStopBlockMessageStatics } from '../../../statics/subagent-stop-block-message/subagent-stop-block-message-statics';
import { HookAgyStopResponder } from './hook-agy-stop-responder';
import { HookAgyStopResponderProxy } from './hook-agy-stop-responder.proxy';

describe('HookAgyStopResponder', () => {
  it('INVALID: {fullyIdle: false} => returns continue with background task message', async () => {
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

  it('VALID: empty or non-object input => returns stop', async () => {
    const result = await HookAgyStopResponder({
      hookInput: null,
    });

    expect(result).toStrictEqual({
      decision: 'stop',
    });
  });
});
