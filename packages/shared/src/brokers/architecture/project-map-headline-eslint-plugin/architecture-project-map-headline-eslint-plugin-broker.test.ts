import { architectureProjectMapHeadlineEslintPluginBroker } from './architecture-project-map-headline-eslint-plugin-broker';
import { architectureProjectMapHeadlineEslintPluginBrokerProxy } from './architecture-project-map-headline-eslint-plugin-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { projectMapHeadlineEslintPluginStatics } from '../../../statics/project-map-headline-eslint-plugin/project-map-headline-eslint-plugin-statics';

const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/eslint-plugin' });

const STARTUP_SOURCE_WITH_CONFIGS = ContentTextStub({
  value: `export const StartEslintPlugin = () => ({
  rules: {},
  configs: {
    dungeonmaster: configDungeonmasterBroker(),
    dungeonmasterTest: configDungeonmasterBroker({ forTesting: true }),
  },
});`,
});

describe('architectureProjectMapHeadlineEslintPluginBroker', () => {
  describe('config presets extracted from startup file', () => {
    it('VALID: {startup with configs block} => config section header present', () => {
      const proxy = architectureProjectMapHeadlineEslintPluginBrokerProxy();

      proxy.setup({
        startupSource: STARTUP_SOURCE_WITH_CONFIGS,
      });

      const result = architectureProjectMapHeadlineEslintPluginBroker({
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some((l) => l === projectMapHeadlineEslintPluginStatics.configSectionHeader),
      ).toBe(true);
    });

    it('VALID: {startup with two presets} => dungeonmaster preset listed', () => {
      const proxy = architectureProjectMapHeadlineEslintPluginBrokerProxy();

      proxy.setup({
        startupSource: STARTUP_SOURCE_WITH_CONFIGS,
      });

      const result = architectureProjectMapHeadlineEslintPluginBroker({
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '- dungeonmaster')).toBe(true);
    });

    it('VALID: {startup with two presets} => dungeonmasterTest preset listed', () => {
      const proxy = architectureProjectMapHeadlineEslintPluginBrokerProxy();

      proxy.setup({
        startupSource: STARTUP_SOURCE_WITH_CONFIGS,
      });

      const result = architectureProjectMapHeadlineEslintPluginBroker({
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '- dungeonmasterTest')).toBe(true);
    });
  });
});
