import { TestProjectNameStub } from './test-project-name.stub';

describe('testProjectNameContract', () => {
  it('VALID: {value: "my-test"} => parses successfully', () => {
    const result = TestProjectNameStub({ value: 'my-test' });

    expect(result).toBe('my-test');
  });

  it('VALID: {value: "no-duplicates"} => parses successfully', () => {
    const result = TestProjectNameStub({ value: 'no-duplicates' });

    expect(result).toBe('no-duplicates');
  });
});
