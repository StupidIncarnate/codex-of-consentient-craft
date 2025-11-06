import { FileContentsStub } from './file-contents.stub';

describe('fileContentsContract', () => {
  it('VALID: {value: source code} => parses successfully', () => {
    const result = FileContentsStub({ value: 'export const example = "test";' });

    expect(result).toBe('export const example = "test";');
  });

  it('VALID: {value: empty string} => parses successfully', () => {
    const result = FileContentsStub({ value: '' });

    expect(result).toBe('');
  });

  it('VALID: {value: multiline content} => parses successfully', () => {
    const content = 'import { z } from "zod";\n\nexport const test = z.string();';
    const result = FileContentsStub({ value: content });

    expect(result).toBe(content);
  });
});
