import { fileContentsContract as _fileContentsContract } from './file-contents-contract';
import { FileContentsStub } from './file-contents.stub';

describe('fileContentsContract', () => {
  it('VALID: {value: "test content"} => parses successfully', () => {
    const result = FileContentsStub({ value: 'test content' });

    expect(result).toBe('test content');
  });

  it('VALID: {value: ""} => parses successfully', () => {
    const result = FileContentsStub({ value: '' });

    expect(result).toBe('');
  });

  it('VALID: {value: multiline code} => parses successfully', () => {
    const result = FileContentsStub({
      value: 'export const foo = (): void => {\n  console.log("hello");\n};\n',
    });

    expect(result).toBe('export const foo = (): void => {\n  console.log("hello");\n};\n');
  });

  it('VALID: {value: with special characters} => parses successfully', () => {
    const result = FileContentsStub({
      value: 'Special chars: @#$%^&*(){}[]|\\:;"\'<>,.?/~`',
    });

    expect(result).toBe('Special chars: @#$%^&*(){}[]|\\:;"\'<>,.?/~`');
  });

  it('VALID: {value: with unicode} => parses successfully', () => {
    const result = FileContentsStub({ value: 'Unicode: 你好世界 🚀 café' });

    expect(result).toBe('Unicode: 你好世界 🚀 café');
  });

  it('VALID: {value: single character} => parses successfully', () => {
    const result = FileContentsStub({ value: 'a' });

    expect(result).toBe('a');
  });
});
