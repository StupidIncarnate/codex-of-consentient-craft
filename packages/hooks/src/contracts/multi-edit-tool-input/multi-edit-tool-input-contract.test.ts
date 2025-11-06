import { MultiEditToolInputStub } from './multi-edit-tool-input.stub';

describe('multiEditToolInputContract', () => {
  it('VALID: {default values} => parses successfully', () => {
    const result = MultiEditToolInputStub();

    expect(result).toStrictEqual({
      file_path: '/test/file.ts',
      edits: [
        {
          old_string: 'old value 1',
          new_string: 'new value 1',
          replace_all: false,
        },
      ],
    });
  });

  it('VALID: {multiple edits} => parses successfully', () => {
    const result = MultiEditToolInputStub({
      edits: [
        { old_string: 'a', new_string: 'b', replace_all: false },
        { old_string: 'c', new_string: 'd', replace_all: true },
      ],
    });

    expect(result.edits).toHaveLength(2);
    expect(result.edits[1].replace_all).toBe(true);
  });
});
