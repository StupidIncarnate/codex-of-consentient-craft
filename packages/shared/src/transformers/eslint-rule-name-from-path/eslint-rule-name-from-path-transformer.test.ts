import { eslintRuleNameFromPathTransformer } from './eslint-rule-name-from-path-transformer';
import { AbsoluteFilePathStub } from '../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('eslintRuleNameFromPathTransformer', () => {
  it('VALID: {ban-primitives broker path} => returns ban-primitives', () => {
    const result = eslintRuleNameFromPathTransformer({
      filePath: AbsoluteFilePathStub({
        value:
          '/repo/packages/eslint-plugin/src/brokers/rule/ban-primitives/rule-ban-primitives-broker.ts',
      }),
    });

    expect(result).toStrictEqual(ContentTextStub({ value: 'ban-primitives' }));
  });

  it('VALID: {enforce-project-structure broker path} => returns enforce-project-structure', () => {
    const result = eslintRuleNameFromPathTransformer({
      filePath: AbsoluteFilePathStub({
        value:
          '/repo/packages/eslint-plugin/src/brokers/rule/enforce-project-structure/rule-enforce-project-structure-broker.ts',
      }),
    });

    expect(result).toStrictEqual(ContentTextStub({ value: 'enforce-project-structure' }));
  });
});
