import { processIdContract } from './process-id-contract';
import { ProcessIdStub } from './process-id.stub';

describe('processIdContract', () => {
  it('VALID: non-empty string => parses successfully', () => {
    const result = ProcessIdStub({ value: 'proc-12345' });

    expect(processIdContract.parse(result)).toBe('proc-12345');
  });
});
