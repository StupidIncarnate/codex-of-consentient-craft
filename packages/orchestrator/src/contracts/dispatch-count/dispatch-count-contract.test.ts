import { dispatchCountContract } from './dispatch-count-contract';
import { DispatchCountStub } from './dispatch-count.stub';

describe('dispatchCountContract', () => {
  it('VALID: {0} => parses to branded DispatchCount', () => {
    expect(DispatchCountStub({ value: 0 })).toBe(0);
  });

  it('VALID: {42} => parses to branded DispatchCount', () => {
    expect(DispatchCountStub({ value: 42 })).toBe(42);
  });

  it('INVALID: {-1} => throws non-negative violation', () => {
    expect(() => dispatchCountContract.parse(-1)).toThrow(/Number must be greater than or equal/u);
  });

  it('INVALID: {1.5} => throws integer violation', () => {
    expect(() => dispatchCountContract.parse(1.5)).toThrow(/Expected integer/u);
  });
});
