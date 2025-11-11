import { toolInputContract } from './tool-input-contract';
import { ToolInputStub } from './tool-input.stub';

describe('toolInputContract', () => {
  it('VALID: {Write tool input} => parses successfully', () => {
    const result = ToolInputStub();

    expect(result).toStrictEqual({
      file_path: '/test/file.ts',
      content: '',
    });
  });

  it('VALID: {Edit tool input} => parses successfully', () => {
    const result = toolInputContract.parse({
      file_path: '/test/file.ts',
      old_string: 'old',
      new_string: 'new',
    });

    expect(result).toStrictEqual({
      file_path: '/test/file.ts',
      old_string: 'old',
      new_string: 'new',
    });
  });

  describe('invalid input', () => {
    it('INVALID: {invalid data} => throws validation error', () => {
      expect(() => {
        return toolInputContract.parse({} as never);
      }).toThrow(/Required/u);
    });
  });
});
