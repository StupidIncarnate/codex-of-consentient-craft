import { writeToolInputContract } from './write-tool-input-contract';
import { WriteToolInputStub } from './write-tool-input.stub';

describe('writeToolInputContract', () => {
  it('VALID: {default values} => parses successfully', () => {
    const result = WriteToolInputStub();

    expect(result).toStrictEqual({
      file_path: '/test/file.ts',
      content: '',
    });
  });

  it('VALID: {custom file_path and content} => parses successfully', () => {
    const result = WriteToolInputStub({
      file_path: '/src/example.ts',
      content: 'export const test = "value";',
    });

    expect(result).toStrictEqual({
      file_path: '/src/example.ts',
      content: 'export const test = "value";',
    });
  });

  describe('invalid input', () => {
    it('INVALID: {invalid data} => throws validation error', () => {
      expect(() => {
        return writeToolInputContract.parse({} as never);
      }).toThrow(/Required/u);
    });
  });
});
