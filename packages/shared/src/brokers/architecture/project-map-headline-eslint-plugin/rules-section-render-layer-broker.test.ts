import { rulesSectionRenderLayerBroker } from './rules-section-render-layer-broker';
import { rulesSectionRenderLayerBrokerProxy } from './rules-section-render-layer-broker.proxy';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { projectMapHeadlineEslintPluginStatics } from '../../../statics/project-map-headline-eslint-plugin/project-map-headline-eslint-plugin-statics';

describe('rulesSectionRenderLayerBroker', () => {
  describe('empty rule list', () => {
    it('EMPTY: {ruleNames: []} => header with 0 total', () => {
      rulesSectionRenderLayerBrokerProxy();

      const result = rulesSectionRenderLayerBroker({ ruleNames: [] });
      const lines = String(result).split('\n');

      expect(lines[0]).toBe(
        `${projectMapHeadlineEslintPluginStatics.rulesSectionHeader} (0 total)`,
      );
    });

    it('EMPTY: {ruleNames: []} => empty notice present', () => {
      rulesSectionRenderLayerBrokerProxy();

      const result = rulesSectionRenderLayerBroker({ ruleNames: [] });
      const lines = String(result).split('\n');

      expect(lines.some((l) => l === projectMapHeadlineEslintPluginStatics.rulesSectionEmpty)).toBe(
        true,
      );
    });
  });

  describe('single prefix', () => {
    it('VALID: {one ban rule} => header with 1 total', () => {
      rulesSectionRenderLayerBrokerProxy();

      const result = rulesSectionRenderLayerBroker({
        ruleNames: [ContentTextStub({ value: 'ban-primitives' })],
      });
      const lines = String(result).split('\n');

      expect(lines[0]).toBe(
        `${projectMapHeadlineEslintPluginStatics.rulesSectionHeader} (1 total)`,
      );
    });

    it('VALID: {one ban rule} => ban- group line present', () => {
      rulesSectionRenderLayerBrokerProxy();

      const result = rulesSectionRenderLayerBroker({
        ruleNames: [ContentTextStub({ value: 'ban-primitives' })],
      });
      const lines = String(result).split('\n');
      const label = 'ban-'.padEnd(projectMapHeadlineEslintPluginStatics.prefixLabelWidth);

      expect(lines.some((l) => l === `${label} (1): ban-primitives`)).toBe(true);
    });
  });

  describe('multi-prefix grouping', () => {
    it('VALID: {ban and enforce rules} => total count is 2', () => {
      rulesSectionRenderLayerBrokerProxy();

      const result = rulesSectionRenderLayerBroker({
        ruleNames: [
          ContentTextStub({ value: 'ban-primitives' }),
          ContentTextStub({ value: 'enforce-project-structure' }),
        ],
      });
      const lines = String(result).split('\n');

      expect(lines[0]).toBe(
        `${projectMapHeadlineEslintPluginStatics.rulesSectionHeader} (2 total)`,
      );
    });
  });
});
