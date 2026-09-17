import { agyTranscriptLineContract } from './agy-transcript-line-contract';
import { AgyTranscriptLineStub } from './agy-transcript-line.stub';

describe('agyTranscriptLineContract', () => {
  it('VALID: {default stub} => parses successfully', () => {
    const result = AgyTranscriptLineStub();

    expect(result.tool_calls).toHaveLength(1);
    expect(result.tool_calls?.[0]?.name).toBe('run_command');
  });

  it('VALID: {empty tool_calls} => parses successfully', () => {
    const result = agyTranscriptLineContract.parse({});

    expect(result.tool_calls).toBeUndefined();
  });
});
