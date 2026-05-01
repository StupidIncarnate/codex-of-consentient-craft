import { listRuleFilesLayerBroker } from './list-rule-files-layer-broker';
import { listRuleFilesLayerBrokerProxy } from './list-rule-files-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/eslint-plugin' });

describe('listRuleFilesLayerBroker', () => {
  describe('empty rules directory', () => {
    it('EMPTY: {no domain folders} => returns empty array', () => {
      const proxy = listRuleFilesLayerBrokerProxy();
      proxy.setupRuleDomains({ domainNames: [] });

      const result = listRuleFilesLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result).toStrictEqual([]);
    });
  });

  describe('rules with broker files', () => {
    it('VALID: {one domain folder with broker file} => returns one file path', () => {
      const proxy = listRuleFilesLayerBrokerProxy();
      proxy.setupRuleDomains({ domainNames: ['ban-primitives'] });

      const result = listRuleFilesLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result).toStrictEqual([
        AbsoluteFilePathStub({
          value:
            '/repo/packages/eslint-plugin/src/brokers/rule/ban-primitives/rule-ban-primitives-broker.ts',
        }),
      ]);
    });

    it('VALID: {two domain folders} => returns two file paths', () => {
      const proxy = listRuleFilesLayerBrokerProxy();
      proxy.setupRuleDomains({ domainNames: ['ban-primitives', 'enforce-project-structure'] });

      const result = listRuleFilesLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result).toStrictEqual([
        AbsoluteFilePathStub({
          value:
            '/repo/packages/eslint-plugin/src/brokers/rule/ban-primitives/rule-ban-primitives-broker.ts',
        }),
        AbsoluteFilePathStub({
          value:
            '/repo/packages/eslint-plugin/src/brokers/rule/enforce-project-structure/rule-enforce-project-structure-broker.ts',
        }),
      ]);
    });
  });
});
