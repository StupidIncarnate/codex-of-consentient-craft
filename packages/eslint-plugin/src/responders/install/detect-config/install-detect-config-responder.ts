/**
 * PURPOSE: Detects existing ESLint config files and creates eslint.config.js if none exist
 *
 * USAGE:
 * const result = InstallDetectConfigResponder({ context });
 * // Creates eslint.config.js with dungeonmaster config or skips if already exists
 */

import { type InstallContext, type InstallResult, installMessageContract, installResultContract } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { existsSync, readFileSync, writeFileSync } from '#gateway/node/fs';
import { join } from '#gateway/node/path';
import { eslintConfigFilesStatics } from '../../../statics/eslint-config-files/eslint-config-files-statics';

const PACKAGE_NAME = '@dungeonmaster/eslint-plugin';

const NEW_CONFIG_TEMPLATE = `const dungeonmaster = require('@dungeonmaster/eslint-plugin').default;
const tsparser = require('@typescript-eslint/parser');
const { gatewayLocationsStatics } = require('@dungeonmaster/shared/statics');
const dungeonmasterConfigs = dungeonmaster.configs.dungeonmaster;
const dungeonmasterTestConfigs = dungeonmaster.configs.dungeonmasterTest;

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
`;

export const InstallDetectConfigResponder = ({
  context,
}: {
  context: InstallContext;
}): InstallResult => {
  for (const configFile of eslintConfigFilesStatics) {
    const configPath = join(context.targetProjectRoot, configFile);

    if (existsSync(configPath)) {
      const content = readFileSync(configPath);

      if (content.includes('@dungeonmaster')) {
        return installResultContract.parse({
          packageName: PACKAGE_NAME,
          success: true,
          action: 'skipped',
          message: installMessageContract.parse('ESLint already configured with dungeonmaster'),
        });
      }

      return installResultContract.parse({
        packageName: PACKAGE_NAME,
        success: true,
        action: 'skipped',
        message: installMessageContract.parse(
          `Found ${configFile} - please add @dungeonmaster/eslint-plugin manually`,
        ),
      });
    }
  }

  const newConfigPath = join(context.targetProjectRoot, locationsStatics.repoRoot.eslintConfig[1]);

  const contents = NEW_CONFIG_TEMPLATE;

  writeFileSync(newConfigPath, contents);

  return installResultContract.parse({
    packageName: PACKAGE_NAME,
    success: true,
    action: 'created',
    message: installMessageContract.parse('Created eslint.config.js'),
  });
};
