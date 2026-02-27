/**
 * PURPOSE: Generates ESLint configuration objects for Dungeonmaster projects with TypeScript and custom rules
 *
 * USAGE:
 * const { typescript, test, fileOverrides, ruleEnforceOn } = configDungeonmasterBroker();
 * // Returns ESLint configs for TypeScript files, test files, and file-specific overrides
 *
 * // For test environments (relaxes some strict rules):
 * const configs = configDungeonmasterBroker({ forTesting: true });
 * // Returns configs with relaxed rules like max-depth, no-magic-numbers for test code
 */
import {
  eslintConfigContract,
  type EslintConfig,
} from '../../../contracts/eslint-config/eslint-config-contract';
import { eslintRuleStatics } from '../../../statics/eslint-rule/eslint-rule-statics';
import { typescriptEslintRuleStatics } from '../../../statics/typescript-eslint-rule/typescript-eslint-rule-statics';
import { jestRuleStatics } from '../../../statics/jest-rule/jest-rule-statics';
import { dungeonmasterRuleEnforceOnStatics } from '@dungeonmaster/shared/statics';
import { typescriptEslintEslintPluginLoadAdapter } from '../../../adapters/typescript-eslint-eslint-plugin/load/typescript-eslint-eslint-plugin-load-adapter';
import { eslintPluginJestLoadAdapter } from '../../../adapters/eslint-plugin-jest/load/eslint-plugin-jest-load-adapter';
import { eslintPluginEslintCommentsLoadAdapter } from '../../../adapters/eslint-plugin-eslint-comments/load/eslint-plugin-eslint-comments-load-adapter';
import { eslintConflictResolverTransformer } from '../../../transformers/eslint-conflict-resolver/eslint-conflict-resolver-transformer';

type DeepWritable<T> = T extends readonly (infer U)[]
  ? DeepWritable<U>[]
  : T extends object
    ? { -readonly [K in keyof T]: DeepWritable<T[K]> }
    : T;

export const configDungeonmasterBroker = ({
  forTesting = false,
}: {
  forTesting?: boolean;
} = {}): {
  typescript: EslintConfig;
  test: EslintConfig;
  fileOverrides: EslintConfig[];
  ruleEnforceOn: typeof dungeonmasterRuleEnforceOnStatics;
} => {
  // Build base configs
  const eslintConfig: EslintConfig = {
    plugins: {},
    rules: {
      ...(eslintRuleStatics.rules as unknown as DeepWritable<typeof eslintRuleStatics.rules>),
      ...(forTesting ? { 'max-depth': 'off' } : {}),
    },
  };

  const baseTypescriptConfig: EslintConfig = {
    plugins: { '@typescript-eslint': typescriptEslintEslintPluginLoadAdapter() },
    rules: {
      ...(typescriptEslintRuleStatics.rules as unknown as DeepWritable<
        typeof typescriptEslintRuleStatics.rules
      >),
      ...(forTesting
        ? {
            '@typescript-eslint/no-magic-numbers': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
          }
        : {}),
    },
  };

  // Merge eslint and typescript with conflict resolution
  const mergedConfig = eslintConflictResolverTransformer({
    reference: eslintConfig,
    overrides: [baseTypescriptConfig],
  });

  // Dungeonmaster custom rules - shared by both typescript and test configs
  const dungeonmasterCustomRules = {
    'eslint-comments/no-unlimited-disable': 'error',
    'eslint-comments/no-use': ['error', { allow: [] }],
    '@dungeonmaster/ban-adhoc-types': 'error',
    '@dungeonmaster/enforce-contract-usage-in-tests': 'error',
    '@dungeonmaster/ban-jest-mock-in-tests': 'error',
    '@dungeonmaster/ban-primitives': [
      'error',
      {
        allowPrimitiveInputs: true,
        allowPrimitiveReturns: false,
      },
    ],
    '@dungeonmaster/enforce-file-metadata': 'error',
    '@dungeonmaster/enforce-implementation-colocation': 'error',
    '@dungeonmaster/enforce-import-dependencies': 'error',
    '@dungeonmaster/enforce-jest-mocked-usage': 'error',
    '@dungeonmaster/enforce-magic-arrays': 'error',
    '@dungeonmaster/enforce-object-destructuring-params': 'error',
    '@dungeonmaster/enforce-optional-guard-params': 'error',
    '@dungeonmaster/enforce-project-structure': 'error',
    '@dungeonmaster/enforce-proxy-child-creation': 'error',
    '@dungeonmaster/enforce-proxy-patterns': 'error',
    '@dungeonmaster/enforce-regex-usage': 'error',
    '@dungeonmaster/enforce-stub-patterns': 'error',
    '@dungeonmaster/enforce-stub-usage': 'error',
    '@dungeonmaster/enforce-test-colocation': 'error',
    '@dungeonmaster/enforce-test-creation-of-proxy': 'error',
    '@dungeonmaster/enforce-test-proxy-imports': 'error',
    '@dungeonmaster/explicit-return-types': 'error',
    '@dungeonmaster/forbid-non-exported-functions': 'error',
    '@dungeonmaster/forbid-todo-skip': 'error',
    '@dungeonmaster/forbid-type-reexport': 'error',
    '@dungeonmaster/jest-mocked-must-import': 'error',
    '@dungeonmaster/no-multiple-property-assertions': 'error',
    '@dungeonmaster/no-mutable-state-in-proxy-factory': 'error',
    '@dungeonmaster/require-contract-validation': 'error',
    '@dungeonmaster/require-zod-on-primitives': 'error',
    '@dungeonmaster/ban-fetch-in-proxies': 'error',
    '@dungeonmaster/ban-startup-branching': 'error',
    // Disable @typescript-eslint/no-require-imports (replaced by require-contract-validation)
    '@typescript-eslint/no-require-imports': 'off',
    /**
     * This rule is problematic with checking key of object
     * None of these narrows the key, so super annoying
     *
     * export const folderConfigTransformer = ({
     *   folderType,
     * }: {
     *   folderType: string;
     * }): FolderConfig | undefined => {
     *   if (!Object.hasOwn(folderConfigStatics, folderType)) {
     *     return undefined;
     *   }
     *
     *   if (!Object.keys(folderConfigStatics).includes(folderType)) {
     *     return undefined;
     *   }
     *
     *   return folderConfigStatics[folderType];
     * };
     */
    '@typescript-eslint/no-unsafe-return': 'off',
  } as const;

  const typescriptConfig: EslintConfig = eslintConfigContract.parse({
    plugins: {
      ...mergedConfig.plugins,
      'eslint-comments': eslintPluginEslintCommentsLoadAdapter() as unknown,
    },
    rules: {
      ...mergedConfig.rules,
      ...(dungeonmasterCustomRules as unknown as DeepWritable<typeof dungeonmasterCustomRules>),
    },
  });

  const testConfig: EslintConfig = eslintConfigContract.parse({
    plugins: {
      ...mergedConfig.plugins,
      'eslint-comments': eslintPluginEslintCommentsLoadAdapter() as unknown,
      ...(forTesting ? { jest: eslintPluginJestLoadAdapter() } : {}),
    },
    rules: {
      ...mergedConfig.rules,
      ...(forTesting
        ? (jestRuleStatics.rules as unknown as DeepWritable<typeof jestRuleStatics.rules>)
        : {}),
      ...(dungeonmasterCustomRules as unknown as DeepWritable<typeof dungeonmasterCustomRules>),
      // Tests have to do a bunch of sad path edge cases so these aren't helpful
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-type-assertion': 'off',
      // It doesnt matter if this happens in tests
      '@typescript-eslint/no-base-to-string': 'off',
    },
  });

  // Proxy files need to use type assertions for mock compatibility
  const proxyOverrides: EslintConfig = eslintConfigContract.parse({
    files: ['**/*.proxy.ts', '**/*.proxy.tsx'],
    rules: {
      '@typescript-eslint/no-unsafe-type-assertion': 'off',
    },
  });

  // Stub files need to use primitives and magic numbers for type conversion
  const stubOverride: EslintConfig = eslintConfigContract.parse({
    files: ['**/*.stub.ts', '**/*.stub.tsx'],
    rules: {
      '@typescript-eslint/no-magic-numbers': 'off',
      // // So that we can spread props as a whole object
      // '@dungeonmaster/enforce-object-destructuring-params': 'off',
    },
  });

  const integrationOverrides: EslintConfig = eslintConfigContract.parse({
    files: ['**/*.integration.test.ts', '**/*.integration.test.tsx'],
    rules: {
      'jest/max-expects': 'off', // int tests need more flow asserts
    },
  });

  const e2eOverrides: EslintConfig = eslintConfigContract.parse({
    files: ['**/*.e2e.test.ts', '**/*.e2e.test.tsx'],
    rules: {
      'jest/max-expects': 'off',
      '@dungeonmaster/enforce-test-creation-of-proxy': 'off',
      '@dungeonmaster/enforce-test-colocation': 'off',
      '@dungeonmaster/require-contract-validation': 'off',
    },
  });

  const startupTestOverrides: EslintConfig = eslintConfigContract.parse({
    files: ['**/startup/*.e2e.test.ts', '**/startup/*.integration.test.ts'],
    rules: {
      'jest/no-hooks': 'off',
    },
  });

  return {
    typescript: typescriptConfig,
    test: testConfig,
    fileOverrides: [
      proxyOverrides,
      stubOverride,
      integrationOverrides,
      e2eOverrides,
      startupTestOverrides,
    ],
    ruleEnforceOn: dungeonmasterRuleEnforceOnStatics,
  };
};
