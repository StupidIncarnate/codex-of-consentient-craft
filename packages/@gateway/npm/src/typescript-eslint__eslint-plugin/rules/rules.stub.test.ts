import { RulesStub } from './rules.stub';

describe('RulesStub', () => {
  it('VALID: {} => the real "no-unused-vars" rule, with its real meta', () => {
    const rules = RulesStub();
    const rule = rules['no-unused-vars'];

    expect({ type: rule?.meta.type, description: rule?.meta.docs.description }).toStrictEqual({
      type: 'problem',
      description: 'Disallow unused variables',
    });
  });
});
