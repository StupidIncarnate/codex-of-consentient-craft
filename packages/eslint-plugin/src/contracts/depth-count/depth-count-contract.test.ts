import { DepthCountStub } from './depth-count.stub';
import { depthCountContract } from './depth-count-contract';

describe('DepthCountStub', () => {
  it('VALID: {value: 0} => returns branded DepthCount', () => {
    const result = DepthCountStub({ value: 0 });

    expect(result).toBe(0);
  });

  it('VALID: {value: 1} => returns branded DepthCount', () => {
    const result = DepthCountStub({ value: 1 });

    expect(result).toBe(1);
  });

  it('VALID: {value: 5} => returns branded DepthCount', () => {
    const result = DepthCountStub({ value: 5 });

    expect(result).toBe(5);
  });

  it('VALID: {} => returns default DepthCount', () => {
    const result = DepthCountStub();

    expect(result).toBe(1);
  });

  it('INVALID: {value: -1} => throws ZodError', () => {
    expect(() => {
      return depthCountContract.parse(-1);
    }).toThrow(/Number must be greater than or equal to 0/u);
  });

  it('INVALID: {value: 1.5} => throws ZodError', () => {
    expect(() => {
      return DepthCountStub({ value: 1.5 });
    }).toThrow(/Expected integer, received float/u);
  });

  it('INVALID: {value: "3"} => throws ZodError', () => {
    expect(() => {
      return DepthCountStub({ value: '3' as never });
    }).toThrow(/Expected number, received string/u);
  });
});
