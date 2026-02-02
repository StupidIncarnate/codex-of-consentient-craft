import { streamSignalContract } from './stream-signal-contract';
import { StreamSignalStub } from './stream-signal.stub';

type StreamSignal = ReturnType<typeof StreamSignalStub>;

describe('streamSignalContract', () => {
  it('VALID: complete signal => parses successfully', () => {
    const result: StreamSignal = StreamSignalStub();

    expect(streamSignalContract.parse(result)).toStrictEqual(result);
  });
});
