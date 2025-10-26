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

  it('VALID: {value: " "} => parses successfully', () => {
    const result = SourceCodeStub({ value: ' ' });

    expect(result).toBe(' ');
  });

  it('VALID: {value: "a"} => parses successfully', () => {
    const result = SourceCodeStub({ value: 'a' });

    expect(result).toBe('a');
  });

  it('VALID: {value: "const msg = \\"He said \\\\\\"hello\\\\\\"\\""} => parses successfully', () => {
    const result = SourceCodeStub({ value: 'const msg = "He said \\"hello\\""' });

    expect(result).toBe('const msg = "He said \\"hello\\""');
  });

  it('VALID: {value: "// Comment only"} => parses successfully', () => {
    const result = SourceCodeStub({ value: '// Comment only' });

    expect(result).toBe('// Comment only');
  });

  it('VALID: {value: multiline code} => parses successfully', () => {
    const multilineCode = 'const x = 1;\nconst y = 2;\nconst z = x + y;';
    const result = SourceCodeStub({ value: multilineCode });

    expect(result).toBe(multilineCode);
  });

  it('VALID: {value: "const pattern = /test/g;"} => parses successfully', () => {
    const result = SourceCodeStub({ value: 'const pattern = /test/g;' });

    expect(result).toBe('const pattern = /test/g;');
  });

  it('VALID: {value: template literal} => parses successfully', () => {
    const templateLiteralCode = [
      'const str = ',
      '`',
      'template ',
      '$',
      '{',
      'literal',
      '}',
      '`',
      ';',
    ].join('');
    const result = SourceCodeStub({
      value: templateLiteralCode,
    });

    expect(result).toBe(templateLiteralCode);
  });

  it('VALID: {value: complex object} => parses successfully', () => {
    const complexObject = 'const obj = { a: 1, b: { c: 2, d: [3, 4] } };';
    const result = SourceCodeStub({ value: complexObject });

    expect(result).toBe(complexObject);
  });

  it('VALID: {value: "const 文字 = \\"値\\";"} => parses successfully', () => {
    const result = SourceCodeStub({ value: 'const 文字 = "値";' });

    expect(result).toBe('const 文字 = "値";');
  });

  it('VALID: {value: very long code} => parses successfully', () => {
    const longCode = 'const x = 1;'.repeat(1000);
    const result = SourceCodeStub({ value: longCode });

    expect(result).toBe(longCode);
  });
});
