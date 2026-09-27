import { RulesStub } from './rules.stub';

describe('RulesStub', () => {
  it('VALID: {} => the real, complete set of rule names the plugin ships', () => {
    const rules = RulesStub();

    expect(Object.keys(rules).sort()).toStrictEqual([
      'disable-enable-pair',
      'no-aggregating-enable',
      'no-duplicate-disable',
      'no-restricted-disable',
      'no-unlimited-disable',
      'no-unused-disable',
      'no-unused-enable',
      'no-use',
      'require-description',
    ]);
  });
});
