import { exportNameContract } from './export-name-contract';
import { ExportNameStub } from './export-name.stub';

describe('exportNameContract', () => {
  it('VALID: {value: "readFile"} => parses to the same text', () => {
    const result = ExportNameStub({ value: 'readFile' });

    expect(result).toBe('readFile');
  });

  it('VALID: {value: "default"} => parses to the same text', () => {
    const result = ExportNameStub({ value: 'default' });

    expect(result).toBe('default');
  });

  it('VALID: {value: "*"} => parses to the same text', () => {
    const result = ExportNameStub({ value: '*' });

    expect(result).toBe('*');
  });

  it('INVALID: {value: ""} => throws a too-small error', () => {
    expect(() => ExportNameStub({ value: '' })).toThrow(/^[\s\S]*>=1 characters[\s\S]*$/u);
  });

  it('INVALID: {value: 123} => throws an expected-string error', () => {
    expect(() => ExportNameStub({ value: 123 as never })).toThrow(
      /^[\s\S]*expected string[\s\S]*$/iu,
    );
  });

  it('VALID: {stub output} => parses again to the same value', () => {
    const stubbed = ExportNameStub();

    const result = exportNameContract.parse(stubbed);

    expect(result).toStrictEqual(stubbed);
  });
});
