import { transcriptToolInvocationContract } from './transcript-tool-invocation-contract';
import { TranscriptToolInvocationStub } from './transcript-tool-invocation.stub';

describe('transcriptToolInvocationContract', () => {
  it('VALID: {name, workItemId: null} => parses with a null workItemId', () => {
    const result = TranscriptToolInvocationStub();

    expect(result).toStrictEqual({
      name: 'mcp__dungeonmaster__signal-back',
      workItemId: null,
    });
  });

  it('VALID: {name, workItemId: "work-1"} => parses with a present workItemId', () => {
    const result = TranscriptToolInvocationStub({
      name: 'mcp__dungeonmaster__get-agent-prompt',
      workItemId: 'work-1',
    });

    expect(result).toStrictEqual({
      name: 'mcp__dungeonmaster__get-agent-prompt',
      workItemId: 'work-1',
    });
  });

  it('INVALID: {name: ""} => fails the min-length brand', () => {
    const result = transcriptToolInvocationContract.safeParse({ name: '', workItemId: null });

    expect(result.success).toBe(false);
  });
});
