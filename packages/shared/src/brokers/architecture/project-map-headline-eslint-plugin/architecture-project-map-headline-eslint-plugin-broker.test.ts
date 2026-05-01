import { architectureProjectMapHeadlineEslintPluginBroker } from './architecture-project-map-headline-eslint-plugin-broker';
import { architectureProjectMapHeadlineEslintPluginBrokerProxy } from './architecture-project-map-headline-eslint-plugin-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { projectMapHeadlineEslintPluginStatics } from '../../../statics/project-map-headline-eslint-plugin/project-map-headline-eslint-plugin-statics';

const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/eslint-plugin' });

const BAN_PRIMITIVES_PATH = AbsoluteFilePathStub({
  value:
    '/repo/packages/eslint-plugin/src/brokers/rule/ban-primitives/rule-ban-primitives-broker.ts',
});

const ENFORCE_PROJECT_STRUCTURE_PATH = AbsoluteFilePathStub({
  value:
    '/repo/packages/eslint-plugin/src/brokers/rule/enforce-project-structure/rule-enforce-project-structure-broker.ts',
});

const BAN_PRIMITIVES_SOURCE = ContentTextStub({
  value: `/**
 * PURPOSE: Bans raw string and number types in favor of Zod contract types
 *
 * USAGE:
 * const rule = ruleBanPrimitivesBroker();
 */
export const ruleBanPrimitivesBroker = () => {};`,
});

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
  describe('empty rules folder', () => {
    it('EMPTY: {no rule domains} => rules section says no rules found', () => {
      const proxy = architectureProjectMapHeadlineEslintPluginBrokerProxy();

      proxy.setup({
        ruleDomainNames: [],
        startupSource: undefined,
        ruleSourceMap: new Map(),
      });

      const result = architectureProjectMapHeadlineEslintPluginBroker({
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === projectMapHeadlineEslintPluginStatics.rulesSectionEmpty)).toBe(
        true,
      );
    });

    it('EMPTY: {no rule domains} => output contains rules section header with 0 total', () => {
      const proxy = architectureProjectMapHeadlineEslintPluginBrokerProxy();

      proxy.setup({
        ruleDomainNames: [],
        startupSource: undefined,
        ruleSourceMap: new Map(),
      });

      const result = architectureProjectMapHeadlineEslintPluginBroker({
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines[0]).toBe(
        `${projectMapHeadlineEslintPluginStatics.rulesSectionHeader} (0 total)`,
      );
    });
  });

  describe('multi-prefix rule list groups correctly', () => {
    it('VALID: {ban and enforce rules} => rules section has ban- group line', () => {
      const proxy = architectureProjectMapHeadlineEslintPluginBrokerProxy();

      proxy.setup({
        ruleDomainNames: [
          ContentTextStub({ value: 'ban-primitives' }),
          ContentTextStub({ value: 'enforce-project-structure' }),
        ],
        startupSource: undefined,
        ruleSourceMap: new Map(),
      });

      const result = architectureProjectMapHeadlineEslintPluginBroker({
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');
      const label = 'ban-'.padEnd(projectMapHeadlineEslintPluginStatics.prefixLabelWidth);

      expect(lines.some((l) => l.startsWith(`${label} (1): ban-primitives`))).toBe(true);
    });

    it('VALID: {ban and enforce rules} => rules section has enforce- group line', () => {
      const proxy = architectureProjectMapHeadlineEslintPluginBrokerProxy();

      proxy.setup({
        ruleDomainNames: [
          ContentTextStub({ value: 'ban-primitives' }),
          ContentTextStub({ value: 'enforce-project-structure' }),
        ],
        startupSource: undefined,
        ruleSourceMap: new Map(),
      });

      const result = architectureProjectMapHeadlineEslintPluginBroker({
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');
      const label = 'enforce-'.padEnd(projectMapHeadlineEslintPluginStatics.prefixLabelWidth);

      expect(lines.some((l) => l.startsWith(`${label} (1): enforce-project-structure`))).toBe(true);
    });

    it('VALID: {single-prefix ban rules} => one group line listing all ban rules', () => {
      const proxy = architectureProjectMapHeadlineEslintPluginBrokerProxy();

      proxy.setup({
        ruleDomainNames: [
          ContentTextStub({ value: 'ban-primitives' }),
          ContentTextStub({ value: 'ban-silent-catch' }),
        ],
        startupSource: undefined,
        ruleSourceMap: new Map(),
      });

      const result = architectureProjectMapHeadlineEslintPluginBroker({
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');
      const label = 'ban-'.padEnd(projectMapHeadlineEslintPluginStatics.prefixLabelWidth);

      expect(lines.some((l) => l === `${label} (2): ban-primitives, ban-silent-catch`)).toBe(true);
    });
  });

  describe('config presets extracted from startup file', () => {
    it('VALID: {startup with configs block} => config section header present', () => {
      const proxy = architectureProjectMapHeadlineEslintPluginBrokerProxy();

      proxy.setup({
        ruleDomainNames: [],
        startupSource: STARTUP_SOURCE_WITH_CONFIGS,
        ruleSourceMap: new Map(),
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
        ruleDomainNames: [],
        startupSource: STARTUP_SOURCE_WITH_CONFIGS,
        ruleSourceMap: new Map(),
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
        ruleDomainNames: [],
        startupSource: STARTUP_SOURCE_WITH_CONFIGS,
        ruleSourceMap: new Map(),
      });

      const result = architectureProjectMapHeadlineEslintPluginBroker({
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '- dungeonmasterTest')).toBe(true);
    });
  });

  describe('exemplar emits PURPOSE line for first rule', () => {
    it('VALID: {ban-primitives rule with PURPOSE} => exemplar header present', () => {
      const proxy = architectureProjectMapHeadlineEslintPluginBrokerProxy();

      proxy.setup({
        ruleDomainNames: [ContentTextStub({ value: 'ban-primitives' })],
        startupSource: undefined,
        ruleSourceMap: new Map([[BAN_PRIMITIVES_PATH, BAN_PRIMITIVES_SOURCE]]),
      });

      const result = architectureProjectMapHeadlineEslintPluginBroker({
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some(
          (l) =>
            l ===
            `${projectMapHeadlineEslintPluginStatics.exemplarSectionPrefix}ban-primitives${projectMapHeadlineEslintPluginStatics.exemplarSectionSuffix}`,
        ),
      ).toBe(true);
    });

    it('VALID: {ban-primitives rule with PURPOSE} => PURPOSE line in exemplar section', () => {
      const proxy = architectureProjectMapHeadlineEslintPluginBrokerProxy();

      proxy.setup({
        ruleDomainNames: [ContentTextStub({ value: 'ban-primitives' })],
        startupSource: undefined,
        ruleSourceMap: new Map([[BAN_PRIMITIVES_PATH, BAN_PRIMITIVES_SOURCE]]),
      });

      const result = architectureProjectMapHeadlineEslintPluginBroker({
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some((l) =>
          l.startsWith('PURPOSE: Bans raw string and number types in favor of Zod contract types'),
        ),
      ).toBe(true);
    });

    it('VALID: {two rules} => exemplar picks first rule (ban-primitives)', () => {
      const proxy = architectureProjectMapHeadlineEslintPluginBrokerProxy();

      proxy.setup({
        ruleDomainNames: [
          ContentTextStub({ value: 'ban-primitives' }),
          ContentTextStub({ value: 'enforce-project-structure' }),
        ],
        startupSource: undefined,
        ruleSourceMap: new Map([
          [BAN_PRIMITIVES_PATH, BAN_PRIMITIVES_SOURCE],
          [
            ENFORCE_PROJECT_STRUCTURE_PATH,
            ContentTextStub({ value: '/** * PURPOSE: Enforces project structure rules */' }),
          ],
        ]),
      });

      const result = architectureProjectMapHeadlineEslintPluginBroker({
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some(
          (l) =>
            l ===
            `${projectMapHeadlineEslintPluginStatics.exemplarSectionPrefix}ban-primitives${projectMapHeadlineEslintPluginStatics.exemplarSectionSuffix}`,
        ),
      ).toBe(true);
    });
  });
});
