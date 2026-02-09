import { timeoutMsContract } from './timeout-ms-contract';
import { TimeoutMsStub } from './timeout-ms.stub';

describe('timeoutMsContract', () => {
  it('VALID: {value: 60000} => parses successfully', () => {
    const timeout = TimeoutMsStub({ value: 60000 });

    expect(timeout).toBe(60000);
  });

  it('VALID: {default} => uses default timeout', () => {
    const timeout = TimeoutMsStub();

    expect(timeout).toBe(60000);
  });

  it('VALID: {value: 0} => parses zero timeout', () => {
    const timeout = TimeoutMsStub({ value: 0 });

    expect(timeout).toBe(0);
  });

  it('INVALID_TIMEOUT: {value: -1} => throws validation error', () => {
    expect(() => {
      return timeoutMsContract.parse(-1);
    }).toThrow(/Number must be greater than or equal to 0/u);
  });

  it('INVALID_TIMEOUT: {value: 1.5} => throws validation error for non-integer', () => {
    expect(() => {
      return timeoutMsContract.parse(1.5);
    }).toThrow(/Expected integer/u);
  });
});
