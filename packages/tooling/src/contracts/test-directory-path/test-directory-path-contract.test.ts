import { TestDirectoryPathStub } from './test-directory-path.stub';

describe('testDirectoryPathContract', () => {
  it('VALID: {value: "/tmp/test-project"} => parses successfully', () => {
    const result = TestDirectoryPathStub({ value: '/tmp/test-project' });

    expect(result).toBe('/tmp/test-project');
  });

  it('VALID: {value: "/home/user/projects/test"} => parses successfully', () => {
    const result = TestDirectoryPathStub({ value: '/home/user/projects/test' });

    expect(result).toBe('/home/user/projects/test');
  });
});
