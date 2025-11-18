import { processOutputContract as _processOutputContract } from './process-output-contract';
import { ProcessOutputStub } from './process-output.stub';

describe('processOutputContract', () => {
  it('VALID: {value: ""} => parses successfully', () => {
    const result = ProcessOutputStub({ value: '' });

    expect(result).toBe('');
  });

  it('VALID: {value: "output text"} => parses successfully', () => {
    const result = ProcessOutputStub({ value: 'output text' });

    expect(result).toBe('output text');
  });

  it('VALID: {value: multiline text} => parses successfully', () => {
    const result = ProcessOutputStub({ value: 'line 1\nline 2\nline 3' });

    expect(result).toBe('line 1\nline 2\nline 3');
  });
});
