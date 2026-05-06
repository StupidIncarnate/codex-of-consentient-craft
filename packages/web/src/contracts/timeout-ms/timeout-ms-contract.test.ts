import { timeoutMsContract } from './timeout-ms-contract';
import { TimeoutMsStub } from './timeout-ms.stub';

describe('timeoutMsContract', () => {
  it('VALID: {30000} => parses', () => {
    expect(timeoutMsContract.parse(30000)).toBe(TimeoutMsStub({ value: 30000 }));
  });

  it('VALID: {1} => parses minimum', () => {
    expect(timeoutMsContract.parse(1)).toBe(TimeoutMsStub({ value: 1 }));
  });

  it('INVALID: {0} => throws', () => {
    expect(() => timeoutMsContract.parse(0)).toThrow(/greater than 0/u);
  });

  it('INVALID: {-1} => throws', () => {
    expect(() => timeoutMsContract.parse(-1)).toThrow(/greater than 0/u);
  });
});
