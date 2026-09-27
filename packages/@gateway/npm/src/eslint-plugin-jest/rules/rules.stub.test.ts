import { RulesStub } from './rules.stub';

describe('RulesStub', () => {
  it('VALID: {} => the real "no-conditional-in-test" rule, with its real meta', () => {
    const rules = RulesStub();
    const rule = rules['no-conditional-in-test'];

    expect({ type: rule?.meta?.type, description: rule?.meta?.docs?.description }).toStrictEqual({
      type: 'problem',
      description: 'Disallow conditional logic in tests',
    });
  });
});
