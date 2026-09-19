import { agyTranscriptLineContract } from './agy-transcript-line-contract';
import { AgyTranscriptLineStub } from './agy-transcript-line.stub';

describe('agyTranscriptLineContract', () => {
  it('VALID: {default stub} => parses successfully', () => {
    const result = AgyTranscriptLineStub();

    expect(result).toStrictEqual({
      tool_calls: [
        {
          name: 'run_command',
          args: { CommandLine: 'git status' },
        },
      ],
    });
  });

  it('VALID: {empty tool_calls} => parses successfully', () => {
    const result = agyTranscriptLineContract.parse({});

    expect(result.tool_calls).toBe(undefined);
  });
});
