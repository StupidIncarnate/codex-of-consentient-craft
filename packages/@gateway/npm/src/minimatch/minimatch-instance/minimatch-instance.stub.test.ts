import { MinimatchInstanceStub } from './minimatch-instance.stub';

describe('MinimatchInstanceStub', () => {
  it('VALID: {} => a real matcher that matches a real matching filename', () => {
    const matcher = MinimatchInstanceStub();

    expect(matcher.match('index.ts')).toBe(true);
  });

  it('VALID: {} => the same real matcher rejects a non-matching filename', () => {
    const matcher = MinimatchInstanceStub();

    expect(matcher.match('index.js')).toBe(false);
  });
});
