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
});
