import { moduleSpecifierContract } from './module-specifier-contract';
import { ModuleSpecifierStub } from './module-specifier.stub';

describe('moduleSpecifierContract', () => {
  it('VALID: {value: "fs/promises"} => parses to the same text', () => {
    const result = ModuleSpecifierStub({ value: 'fs/promises' });

    expect(result).toBe('fs/promises');
  });

  it('VALID: {value: "./x/y"} => parses to the same text', () => {
    const result = ModuleSpecifierStub({ value: './x/y' });

    expect(result).toBe('./x/y');
  });

  it('VALID: {value: "#gateway/node/fs__promises"} => parses to the same text', () => {
    const result = ModuleSpecifierStub({ value: '#gateway/node/fs__promises' });

    expect(result).toBe('#gateway/node/fs__promises');
  });

  it('INVALID: {value: ""} => throws a too-small error', () => {
    expect(() => ModuleSpecifierStub({ value: '' })).toThrow(/^[\s\S]*>=1 characters[\s\S]*$/u);
  });

  it('INVALID: {value: 123} => throws an expected-string error', () => {
    expect(() => ModuleSpecifierStub({ value: 123 as never })).toThrow(
      /^[\s\S]*expected string[\s\S]*$/iu,
    );
  });

  it('VALID: {stub output} => parses again to the same value', () => {
    const stubbed = ModuleSpecifierStub();

    const result = moduleSpecifierContract.parse(stubbed);

    expect(result).toStrictEqual(stubbed);
  });
});
