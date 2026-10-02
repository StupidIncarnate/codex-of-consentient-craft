import { InstallDetectConfigResponderProxy } from './install-detect-config-responder.proxy';
import { InstallContextStub } from '@dungeonmaster/shared/contracts/install-context/install-context.stub';

describe('InstallDetectConfigResponder', () => {
  describe('no existing config', () => {
    it('VALID: {context: no existing config} => creates eslint.config.js', () => {
      const proxy = InstallDetectConfigResponderProxy();
      proxy.setupNoConfigExists({ targetProjectRoot: '/test/project' });

      const result = proxy.callResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: '/test/project',
            dungeonmasterRoot: '/test/.dungeonmaster',
          },
        }),
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/eslint-plugin',
        success: true,
        action: 'created',
        message: 'Created eslint.config.js',
      });
    });

    it('VALID: {context: no existing config} => the written config wires the gateway rule set for packages/@gateway', () => {
      const proxy = InstallDetectConfigResponderProxy();
      proxy.setupNoConfigExists({ targetProjectRoot: '/test/project' });

      proxy.callResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: '/test/project',
            dungeonmasterRoot: '/test/.dungeonmaster',
          },
        }),
      });

      const content = proxy.getWrittenConfigContent({ targetProjectRoot: '/test/project' });

      // Left out, a real consumer's copied `packages/@gateway/**` source fails
      // `enforce-project-structure` wholesale — that rule's valid-folder-type list has no entry
      // for a gateway's own folder names (`process/`, `readline/`, `util/`, …), and only this
      // `ignores` + a separate `files: dungeonmasterConfigs.gateway.files` block re-scopes them to
      // the gateway's own short rule set (confirmed against a real scratch-consumer run, item G25).
      expect(content).toBe(
        `const dungeonmaster = require('@dungeonmaster/eslint-plugin').default;
const {
    configDungeonmasterBroker,
    configGatewayLintConfigBroker,
    configWorkspacePackageNamesBroker,
} = require('@dungeonmaster/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');
const { gatewayLocationsStatics } = require('@dungeonmaster/shared/statics');

const gatewayLintConfig = configGatewayLintConfigBroker({
    startDir: __dirname,
});

const workspacePackageNames = configWorkspacePackageNamesBroker({
    startDir: __dirname,
});

const dungeonmasterConfigs = configDungeonmasterBroker({ gatewayLintConfig, workspacePackageNames });
const dungeonmasterTestConfigs = configDungeonmasterBroker({
    forTesting: true,
    gatewayLintConfig,
    workspacePackageNames,
});

module.exports = [
    // Compiled output is never lint's to grade — left off, a build anywhere in the workspace
    // (this package's own \`npm run build\`, or a scaffolded gateway package's) leaves ESLint
    // trying to type-check \`dist/**/*.d.ts\` against a tsconfig whose \`include\` never named it,
    // which fails every one of those files with a parser error, not a rule violation.
    {
        ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**'],
    },
    {
        files: ['**/*.ts', '**/*.tsx'],
        // The gateway carve-out: these files get the gateway rule block below instead — a
        // re-scoped, positive rule set, not this block's workspace rules minus some turned off.
        ignores: ['**/*.test.ts', '**/*.test.tsx', ...gatewayLocationsStatics.packageGlobs],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: 'module',
                project: './tsconfig.json',
            },
        },
        plugins: {
            ...dungeonmasterConfigs.typescript.plugins,
            '@dungeonmaster': dungeonmaster,
        },
        rules: {...dungeonmasterConfigs.typescript.rules},
    },
    // The gateway's own positive rule set (packages/@gateway/{npm,node,browser,bin}/src/**). Its
    // tests still get the test block below by file suffix, the same as every other package's tests.
    {
        files: dungeonmasterConfigs.gateway.files,
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: 'module',
                project: './tsconfig.json',
            },
        },
        plugins: {
            ...dungeonmasterConfigs.gateway.plugins,
            '@dungeonmaster': dungeonmaster,
        },
        rules: {...dungeonmasterConfigs.gateway.rules},
    },
    ...dungeonmasterConfigs.fileOverrides,
    {
        files: ['**/*.test.ts', '**/*.test.tsx'],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: 'module',
                project: './tsconfig.json',
            },
        },
        plugins: {
            ...dungeonmasterTestConfigs.test.plugins,
            '@dungeonmaster': dungeonmaster,
        },
        rules: {...dungeonmasterTestConfigs.test.rules},
    },
    ...dungeonmasterTestConfigs.fileOverrides,
];
`,
      );
    });

    it('VALID: {context: no existing config} => the written config calls configGatewayLintConfigBroker and configWorkspacePackageNamesBroker and configures dungeonmasterConfigs', () => {
      const proxy = InstallDetectConfigResponderProxy();
      proxy.setupNoConfigExists({ targetProjectRoot: '/test/project' });

      proxy.callResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: '/test/project',
            dungeonmasterRoot: '/test/.dungeonmaster',
          },
        }),
      });

      const lines = String(
        proxy.getWrittenConfigContent({ targetProjectRoot: '/test/project' }),
      ).split('\n');

      expect(lines.slice(0, 23)).toStrictEqual([
        "const dungeonmaster = require('@dungeonmaster/eslint-plugin').default;",
        'const {',
        '    configDungeonmasterBroker,',
        '    configGatewayLintConfigBroker,',
        '    configWorkspacePackageNamesBroker,',
        "} = require('@dungeonmaster/eslint-plugin');",
        "const tsparser = require('@typescript-eslint/parser');",
        "const { gatewayLocationsStatics } = require('@dungeonmaster/shared/statics');",
        '',
        'const gatewayLintConfig = configGatewayLintConfigBroker({',
        '    startDir: __dirname,',
        '});',
        '',
        'const workspacePackageNames = configWorkspacePackageNamesBroker({',
        '    startDir: __dirname,',
        '});',
        '',
        'const dungeonmasterConfigs = configDungeonmasterBroker({ gatewayLintConfig, workspacePackageNames });',
        'const dungeonmasterTestConfigs = configDungeonmasterBroker({',
        '    forTesting: true,',
        '    gatewayLintConfig,',
        '    workspacePackageNames,',
        '});',
      ]);
    });
  });

  describe('existing config with dungeonmaster', () => {
    it('VALID: {context: eslint.config.js exists with @dungeonmaster and both brokers} => skips installation as already configured', () => {
      const proxy = InstallDetectConfigResponderProxy();
      proxy.setupConfigExists({
        targetProjectRoot: '/test/project',
        configFileName: 'eslint.config.js',
        contents: `const dungeonmaster = require('@dungeonmaster/eslint-plugin');
const { configGatewayLintConfigBroker, configWorkspacePackageNamesBroker } = require('@dungeonmaster/eslint-plugin');
`,
      });

      const result = proxy.callResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: '/test/project',
            dungeonmasterRoot: '/test/.dungeonmaster',
          },
        }),
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/eslint-plugin',
        success: true,
        action: 'skipped',
        message: 'ESLint already configured with dungeonmaster',
      });
    });

    it('VALID: {context: eslint.config.js exists with @dungeonmaster but lacks both brokers} => skips with manual instruction naming both brokers', () => {
      const proxy = InstallDetectConfigResponderProxy();
      proxy.setupConfigExists({
        targetProjectRoot: '/test/project',
        configFileName: 'eslint.config.js',
        contents: "const dungeonmaster = require('@dungeonmaster/eslint-plugin');",
      });

      const result = proxy.callResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: '/test/project',
            dungeonmasterRoot: '/test/.dungeonmaster',
          },
        }),
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/eslint-plugin',
        success: true,
        action: 'skipped',
        message:
          'Found eslint.config.js - please add configGatewayLintConfigBroker and configWorkspacePackageNamesBroker manually',
      });
    });

    it('VALID: {context: eslint.config.js has @dungeonmaster and gateway broker but lacks workspace broker} => skips naming workspace broker', () => {
      const proxy = InstallDetectConfigResponderProxy();
      proxy.setupConfigExists({
        targetProjectRoot: '/test/project',
        configFileName: 'eslint.config.js',
        contents: `const dungeonmaster = require('@dungeonmaster/eslint-plugin');
const { configGatewayLintConfigBroker } = require('@dungeonmaster/eslint-plugin');
`,
      });

      const result = proxy.callResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: '/test/project',
            dungeonmasterRoot: '/test/.dungeonmaster',
          },
        }),
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/eslint-plugin',
        success: true,
        action: 'skipped',
        message: 'Found eslint.config.js - please add configWorkspacePackageNamesBroker manually',
      });
    });

    it('VALID: {context: eslint.config.js has @dungeonmaster and workspace broker but lacks gateway broker} => skips naming gateway broker', () => {
      const proxy = InstallDetectConfigResponderProxy();
      proxy.setupConfigExists({
        targetProjectRoot: '/test/project',
        configFileName: 'eslint.config.js',
        contents: `const dungeonmaster = require('@dungeonmaster/eslint-plugin');
const { configWorkspacePackageNamesBroker } = require('@dungeonmaster/eslint-plugin');
`,
      });

      const result = proxy.callResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: '/test/project',
            dungeonmasterRoot: '/test/.dungeonmaster',
          },
        }),
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/eslint-plugin',
        success: true,
        action: 'skipped',
        message: 'Found eslint.config.js - please add configGatewayLintConfigBroker manually',
      });
    });
  });

  describe('existing config without dungeonmaster', () => {
    it('VALID: {context: eslint.config.js exists without @dungeonmaster} => skips with manual instruction naming all three items', () => {
      const proxy = InstallDetectConfigResponderProxy();
      proxy.setupConfigExists({
        targetProjectRoot: '/test/project',
        configFileName: 'eslint.config.js',
        contents: 'module.exports = { rules: {} };',
      });

      const result = proxy.callResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: '/test/project',
            dungeonmasterRoot: '/test/.dungeonmaster',
          },
        }),
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/eslint-plugin',
        success: true,
        action: 'skipped',
        message:
          'Found eslint.config.js - please add @dungeonmaster/eslint-plugin, configGatewayLintConfigBroker, and configWorkspacePackageNamesBroker manually',
      });
    });

    it('VALID: {context: eslint.config.mjs exists without @dungeonmaster} => skips with manual instruction naming all three items', () => {
      const proxy = InstallDetectConfigResponderProxy();
      proxy.setupConfigExists({
        targetProjectRoot: '/test/project',
        configFileName: 'eslint.config.mjs',
        contents: 'export default { rules: {} };',
      });

      const result = proxy.callResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: '/test/project',
            dungeonmasterRoot: '/test/.dungeonmaster',
          },
        }),
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/eslint-plugin',
        success: true,
        action: 'skipped',
        message:
          'Found eslint.config.mjs - please add @dungeonmaster/eslint-plugin, configGatewayLintConfigBroker, and configWorkspacePackageNamesBroker manually',
      });
    });
  });
});
