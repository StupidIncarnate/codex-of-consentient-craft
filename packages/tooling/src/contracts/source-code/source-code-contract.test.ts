import { SourceCodeStub } from './source-code.stub';

describe('sourceCodeContract', () => {
  it('VALID: {value: "const x = 1;"} => parses successfully', () => {
    const result = SourceCodeStub({ value: 'const x = 1;' });

    expect(result).toBe('const x = 1;');
  });

  it('VALID: {value: "export const foo = () => {}"} => parses successfully', () => {
    const result = SourceCodeStub({ value: 'export const foo = () => {}' });

    expect(result).toBe('export const foo = () => {}');
  });

  it('VALID: {value: ""} => parses successfully', () => {
    const result = SourceCodeStub({ value: '' });

    expect(result).toBe('');
  });
});
