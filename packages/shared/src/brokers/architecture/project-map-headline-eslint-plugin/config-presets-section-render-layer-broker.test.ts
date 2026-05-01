import { configPresetsSectionRenderLayerBroker } from './config-presets-section-render-layer-broker';
import { configPresetsSectionRenderLayerBrokerProxy } from './config-presets-section-render-layer-broker.proxy';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { projectMapHeadlineEslintPluginStatics } from '../../../statics/project-map-headline-eslint-plugin/project-map-headline-eslint-plugin-statics';

const SOURCE_WITH_CONFIGS = ContentTextStub({
  value:
    'return { configs: { dungeonmaster: configDungeonmasterBroker(), dungeonmasterTest: configDungeonmasterBroker({ forTesting: true }) } };',
});

describe('configPresetsSectionRenderLayerBroker', () => {
  describe('no startup source', () => {
    it('EMPTY: {startupSource: undefined} => empty notice present', () => {
      configPresetsSectionRenderLayerBrokerProxy();

      const result = configPresetsSectionRenderLayerBroker({ startupSource: undefined });
      const lines = String(result).split('\n');

      expect(
        lines.some((l) => l === projectMapHeadlineEslintPluginStatics.configSectionEmpty),
      ).toBe(true);
    });
  });

  describe('source with config presets', () => {
    it('VALID: {source with two presets} => header present', () => {
      configPresetsSectionRenderLayerBrokerProxy();

      const result = configPresetsSectionRenderLayerBroker({
        startupSource: SOURCE_WITH_CONFIGS,
      });
      const lines = String(result).split('\n');

      expect(lines[0]).toBe(projectMapHeadlineEslintPluginStatics.configSectionHeader);
    });

    it('VALID: {source with dungeonmaster preset} => listed as bullet', () => {
      configPresetsSectionRenderLayerBrokerProxy();

      const result = configPresetsSectionRenderLayerBroker({
        startupSource: SOURCE_WITH_CONFIGS,
      });
      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '- dungeonmaster')).toBe(true);
    });
  });
});
