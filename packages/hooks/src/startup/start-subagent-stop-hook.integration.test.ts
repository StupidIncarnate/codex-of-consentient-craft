import { SubagentStopHookDataStub } from '../contracts/subagent-stop-hook-data/subagent-stop-hook-data.stub';
import { subagentStopBlockMessageStatics } from '../statics/subagent-stop-block-message/subagent-stop-block-message-statics';

import { hookPersistentRunnerHarness } from '../../test/harnesses/hook-runner/hook-persistent-runner.harness';
import { transcriptHarness } from '../../test/harnesses/transcript/transcript.harness';

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

describe('start-subagent-stop-hook', () => {
  const persistentRunner = hookPersistentRunnerHarness();
  const transcripts = transcriptHarness();

  beforeAll(async () => {
    await persistentRunner.start({ hookName: 'start-subagent-stop-hook' });
  });

  afterAll(async () => {
    await persistentRunner.stop();
  });

  it('VALID: {work-item agent transcript without signal-back} => exit 0 with a block decision', async () => {
    const transcriptPath = transcripts.write({ contents: workItemAgentLine });
    const hookData = SubagentStopHookDataStub({ agent_transcript_path: transcriptPath });

    const result = await persistentRunner.runHook({ hookData });

    transcripts.cleanup();

    expect(result).toStrictEqual({
      exitCode: 0,
      stdout: JSON.stringify({
        decision: 'block',
        reason: subagentStopBlockMessageStatics.blockMessage,
      }),
      stderr: '',
    });
  });

  it('VALID: {work-item agent transcript with signal-back} => exit 0 with empty stdout', async () => {
    const transcriptPath = transcripts.write({
      contents: [workItemAgentLine, signalBackLine].join('\n'),
    });
    const hookData = SubagentStopHookDataStub({ agent_transcript_path: transcriptPath });

    const result = await persistentRunner.runHook({ hookData });

    transcripts.cleanup();

    expect(result).toStrictEqual({ exitCode: 0, stdout: '', stderr: '' });
  });
});
