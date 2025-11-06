import { QuestmaestroHooksConfigStub } from './questmaestro-hooks-config.stub';

describe('questmaestroHooksConfigContract', () => {
  it('VALID: {with preEditLint} => parses successfully', () => {
    const result = QuestmaestroHooksConfigStub();

    expect(result.preEditLint?.rules[0]).toBe('@questmaestro/enforce-project-structure');
  });

  it('VALID: {without preEditLint} => parses successfully', () => {
    const result = QuestmaestroHooksConfigStub({ preEditLint: undefined });

    expect(result.preEditLint).toBeUndefined();
  });
});
