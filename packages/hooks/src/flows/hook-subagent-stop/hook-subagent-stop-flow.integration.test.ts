import { HookSubagentStopFlow } from './hook-subagent-stop-flow';
import { SubagentStopHookDataStub } from '../../contracts/subagent-stop-hook-data/subagent-stop-hook-data.stub';
import { subagentStopBlockMessageStatics } from '../../statics/subagent-stop-block-message/subagent-stop-block-message-statics';
import { transcriptHarness } from '../../../test/harnesses/transcript/transcript.harness';

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

// A PARENT (/dumpster-launch) session line — no get-agent-prompt-with-workItemId, so reading it
// would NOT trigger a block. Used to prove the hook reads agent_transcript_path, not transcript_path.
const parentSessionLine = JSON.stringify({
  message: {
    role: 'assistant',
    content: [{ type: 'tool_use', id: 'p1', name: 'mcp__dungeonmaster__get-next-step', input: {} }],
  },
});

const blockStdout = JSON.stringify({
  decision: 'block',
  reason: subagentStopBlockMessageStatics.blockMessage,
});

describe('HookSubagentStopFlow', () => {
  const transcripts = transcriptHarness();

  it('VALID: {agent_transcript_path = work-item agent without signal-back} => blocks the stop', async () => {
    const agentTranscriptPath = transcripts.write({ contents: workItemAgentLine });

    const result = await HookSubagentStopFlow({
      inputData: JSON.stringify(
        SubagentStopHookDataStub({ agent_transcript_path: agentTranscriptPath }),
      ),
    });

    transcripts.cleanup();

    expect(result).toStrictEqual({ stdout: blockStdout, stderr: '', exitCode: 0 });
  });

  it('VALID: {agent_transcript_path = work-item agent WITH signal-back} => allows the stop', async () => {
    const agentTranscriptPath = transcripts.write({
      contents: [workItemAgentLine, signalBackLine].join('\n'),
    });

    const result = await HookSubagentStopFlow({
      inputData: JSON.stringify(
        SubagentStopHookDataStub({ agent_transcript_path: agentTranscriptPath }),
      ),
    });

    transcripts.cleanup();

    expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
  });

  it('VALID: {agent_transcript_path set, transcript_path is the unrelated parent} => reads agent_transcript_path and blocks', async () => {
    const agentTranscriptPath = transcripts.write({ contents: workItemAgentLine });
    const parentTranscriptPath = transcripts.write({ contents: parentSessionLine });

    const result = await HookSubagentStopFlow({
      inputData: JSON.stringify(
        SubagentStopHookDataStub({
          transcript_path: parentTranscriptPath,
          agent_transcript_path: agentTranscriptPath,
        }),
      ),
    });

    transcripts.cleanup();

    expect(result).toStrictEqual({ stdout: blockStdout, stderr: '', exitCode: 0 });
  });

  it('VALID: {no agent_transcript_path} => falls back to transcript_path', async () => {
    const transcriptPath = transcripts.write({ contents: workItemAgentLine });

    const result = await HookSubagentStopFlow({
      inputData: JSON.stringify(SubagentStopHookDataStub({ transcript_path: transcriptPath })),
    });

    transcripts.cleanup();

    expect(result).toStrictEqual({ stdout: blockStdout, stderr: '', exitCode: 0 });
  });

  it('ERROR: {missing transcript file} => allows the stop', async () => {
    const agentTranscriptPath = transcripts.missingPath();

    const result = await HookSubagentStopFlow({
      inputData: JSON.stringify(
        SubagentStopHookDataStub({ agent_transcript_path: agentTranscriptPath }),
      ),
    });

    transcripts.cleanup();

    expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
  });

  it('ERROR: {malformed JSON stdin} => returns exit code 1', async () => {
    const result = await HookSubagentStopFlow({ inputData: 'not json' });

    expect({ exitCode: result.exitCode, stdout: result.stdout }).toStrictEqual({
      exitCode: 1,
      stdout: '',
    });
  });
});
