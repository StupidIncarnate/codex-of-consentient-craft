import { timeoutMsContract } from './timeout-ms-contract';
import { TimeoutMsStub } from './timeout-ms.stub';

type TimeoutMs = ReturnType<typeof TimeoutMsStub>;

describe('timeoutMsContract', () => {
  it('VALID: positive integer => parses successfully', () => {
    const result: TimeoutMs = TimeoutMsStub({ value: 60000 });

    expect(timeoutMsContract.parse(result)).toBe(60000);
  });
});
