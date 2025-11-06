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
    const result = ToolInputStub({
      file_path: '/test/file.ts',
      old_string: 'old',
      new_string: 'new',
    });

    expect(result.old_string).toBe('old');
    expect(result.new_string).toBe('new');
  });
});
