import { devLogLineContract } from './dev-log-line-contract';
import { DevLogLineStub } from './dev-log-line.stub';

describe('devLogLineContract', () => {
  it('VALID: {non-empty string} => parses successfully', () => {
    const result = devLogLineContract.parse('◂  chat-output  proc:abc12345');

    expect(result).toBe('◂  chat-output  proc:abc12345');
  });

  it('VALID: {stub default} => round-trips through contract', () => {
    const stub = DevLogLineStub();

    expect(devLogLineContract.parse(stub)).toBe(stub);
  });

  it('VALID: {empty string} => parses as empty', () => {
    const result = DevLogLineStub({ value: '' });

    expect(devLogLineContract.parse(result)).toBe('');
  });
});
