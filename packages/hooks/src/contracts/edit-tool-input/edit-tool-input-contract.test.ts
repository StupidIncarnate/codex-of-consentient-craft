import { EditToolInputStub } from './edit-tool-input.stub';

describe('editToolInputContract', () => {
  it('VALID: {default values} => parses successfully', () => {
    const result = EditToolInputStub();

    expect(result).toStrictEqual({
      file_path: '/test/file.ts',
      old_string: 'old value',
      new_string: 'new value',
      replace_all: false,
    });
  });

  it('VALID: {with replace_all true} => parses successfully', () => {
    const result = EditToolInputStub({ replace_all: true });

    expect(result.replace_all).toBe(true);
  });

  it('VALID: {custom strings} => parses successfully', () => {
    const result = EditToolInputStub({
      old_string: 'foo',
      new_string: 'bar',
    });

    expect(result.old_string).toBe('foo');
    expect(result.new_string).toBe('bar');
  });
});
