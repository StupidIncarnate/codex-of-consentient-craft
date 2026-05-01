import { exemplarSectionRenderLayerBroker } from './exemplar-section-render-layer-broker';
import { exemplarSectionRenderLayerBrokerProxy } from './exemplar-section-render-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { projectMapHeadlineEslintPluginStatics } from '../../../statics/project-map-headline-eslint-plugin/project-map-headline-eslint-plugin-statics';

const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/eslint-plugin' });
const RULE_FILE_PATH = AbsoluteFilePathStub({
  value:
    '/repo/packages/eslint-plugin/src/brokers/rule/ban-primitives/rule-ban-primitives-broker.ts',
});
const RULE_NAME = ContentTextStub({ value: 'ban-primitives' });

const SOURCE_WITH_PURPOSE = ContentTextStub({
  value: `/**
 * PURPOSE: Bans raw string and number types
 */
export const ruleBanPrimitivesBroker = () => {};`,
});

describe('exemplarSectionRenderLayerBroker', () => {
  describe('exemplar header', () => {
    it('VALID: {ban-primitives rule} => exemplar header with rule name present', () => {
      const proxy = exemplarSectionRenderLayerBrokerProxy();
      proxy.setupImplementation({
        fn: () => SOURCE_WITH_PURPOSE,
      });

      const result = exemplarSectionRenderLayerBroker({
        ruleName: RULE_NAME,
        ruleFilePath: RULE_FILE_PATH,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines[0]).toBe(
        `${projectMapHeadlineEslintPluginStatics.exemplarSectionPrefix}ban-primitives${projectMapHeadlineEslintPluginStatics.exemplarSectionSuffix}`,
      );
    });

    it('VALID: {ban-primitives rule} => file path line with relative path present', () => {
      const proxy = exemplarSectionRenderLayerBrokerProxy();
      proxy.setupImplementation({
        fn: () => SOURCE_WITH_PURPOSE,
      });

      const result = exemplarSectionRenderLayerBroker({
        ruleName: RULE_NAME,
        ruleFilePath: RULE_FILE_PATH,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some((l) =>
          l.startsWith('File: `src/brokers/rule/ban-primitives/rule-ban-primitives-broker.ts`'),
        ),
      ).toBe(true);
    });

    it('VALID: {source with PURPOSE} => PURPOSE line present in exemplar', () => {
      const proxy = exemplarSectionRenderLayerBrokerProxy();
      proxy.setupImplementation({
        fn: () => SOURCE_WITH_PURPOSE,
      });

      const result = exemplarSectionRenderLayerBroker({
        ruleName: RULE_NAME,
        ruleFilePath: RULE_FILE_PATH,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === 'PURPOSE: Bans raw string and number types')).toBe(true);
    });
  });
});
