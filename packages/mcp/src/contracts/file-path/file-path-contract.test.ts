import { FilePathStub } from './file-path.stub';

describe('filePathContract', () => {
  it('VALID: {value: "/test/path"} => parses successfully', () => {
    const result = FilePathStub({ value: '/test/path' });

    expect(result).toBe('/test/path');
  });
});
