import { outsideCallContract } from './outside-call-contract';
import { OutsideCallStub } from './outside-call.stub';

describe('outsideCallContract', () => {
  it('VALID: {defaults} => parses the default call', () => {
    const result = OutsideCallStub();

    expect(result).toStrictEqual({ module: 'fs/promises', name: 'readFile' });
  });

  it('VALID: {module: "setTimeout", name: "setTimeout"} => parses a global call', () => {
    const result = OutsideCallStub({
      module: 'setTimeout' as never,
      name: 'setTimeout' as never,
    });

    expect(result).toStrictEqual({ module: 'setTimeout', name: 'setTimeout' });
  });

  it('INVALID: {module: ""} => throws a too-small error', () => {
    expect(() => OutsideCallStub({ module: '' as never })).toThrow(
      /^[\s\S]*>=1 characters[\s\S]*$/u,
    );
  });

  it('VALID: {stub output} => parses again to the same value', () => {
    const stubbed = OutsideCallStub();

    const result = outsideCallContract.parse(stubbed);

    expect(result).toStrictEqual(stubbed);
  });
});
