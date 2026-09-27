import { LinterStub } from './linter.stub';

describe('LinterStub', () => {
  it('VALID: {} => a real Linter that actually lints code', () => {
    const linter = LinterStub();

    const messages = linter.verify('const a = 1;', { rules: { 'no-unused-vars': 'error' } });

    expect(messages.map((message) => message.ruleId)).toStrictEqual(['no-unused-vars']);
  });
});
