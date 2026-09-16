import { serverLogByteCountContract } from './server-log-byte-count-contract';
import { ServerLogByteCountStub } from './server-log-byte-count.stub';

describe('serverLogByteCountContract', () => {
  it('VALID: {value: 1024} => parses and returns branded ServerLogByteCount', () => {
    const result = ServerLogByteCountStub({ value: 1_024 });

    expect(result).toBe(1_024);
  });

  it('INVALID: {value: -1} => throws for a negative byte count', () => {
    expect(() => serverLogByteCountContract.parse(-1)).toThrow(
      /Number must be greater than or equal to 0/u,
    );
  });

  it('INVALID: {value: 1.5} => throws for a non-integer', () => {
    expect(() => serverLogByteCountContract.parse(1.5)).toThrow(
      /Expected integer, received float/u,
    );
  });

  it('EDGE: {value: 0} => parses the zero boundary', () => {
    const result = ServerLogByteCountStub({ value: 0 });

    expect(result).toBe(0);
  });
});
