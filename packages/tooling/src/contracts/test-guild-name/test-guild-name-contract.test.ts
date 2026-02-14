import { testGuildNameContract as _testGuildNameContract } from './test-guild-name-contract';
import { TestGuildNameStub } from './test-guild-name.stub';

describe('testGuildNameContract', () => {
  it('VALID: {value: "my-test"} => parses successfully', () => {
    const result = TestGuildNameStub({ value: 'my-test' });

    expect(result).toBe('my-test');
  });

  it('VALID: {value: "no-duplicates"} => parses successfully', () => {
    const result = TestGuildNameStub({ value: 'no-duplicates' });

    expect(result).toBe('no-duplicates');
  });
});
