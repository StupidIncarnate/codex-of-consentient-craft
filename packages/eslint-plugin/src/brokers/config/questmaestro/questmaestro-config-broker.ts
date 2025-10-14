import type { EslintConfig } from '../../../contracts/eslint-config/eslint-config-contract';
import { eslintRuleStatics } from '../../../statics/eslint-rule/eslint-rule-statics';
import { typescriptEslintRuleStatics } from '../../../statics/typescript-eslint-rule/typescript-eslint-rule-statics';
import { jestRuleStatics } from '../../../statics/jest-rule/jest-rule-statics';
import { typescriptEslintEslintPlugin } from '../../../adapters/typescript-eslint-eslint-plugin/typescript-eslint-eslint-plugin-adapter';
import { eslintPluginJestAdapter } from '../../../adapters/eslint-plugin-jest/eslint-plugin-jest-adapter';
import { eslintPluginEslintCommentsAdapter } from '../../../adapters/eslint-plugin-eslint-comments/eslint-plugin-eslint-comments-adapter';
import { eslintConflictResolverTransformer } from '../../../transformers/eslint-conflict-resolver/eslint-conflict-resolver-transformer';

type DeepWritable<T> = T extends readonly (infer U)[]
  ? DeepWritable<U>[]
  : T extends object
    ? { -readonly [K in keyof T]: DeepWritable<T[K]> }
    : T;

export const questmaestroConfigBroker = ({
  forTesting = false,
}: {
  forTesting?: boolean;
} = {}): { typescript: EslintConfig; test: EslintConfig; fileOverrides: EslintConfig[] } => {
  // Build base configs
  const eslintConfig: EslintConfig = {
    plugins: {},
    rules: {
      ...(eslintRuleStatics.rules as unknown as DeepWritable<typeof eslintRuleStatics.rules>),
      ...(forTesting ? { 'max-depth': 'off' } : {}),
    },
  };

  const baseTypescriptConfig: EslintConfig = {
    plugins: { '@typescript-eslint': typescriptEslintEslintPlugin },
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

  // Questmaestro custom rules - shared by both typescript and test configs
  const questmaestroCustomRules = {
    'eslint-comments/no-unlimited-disable': 'error',
    'eslint-comments/no-use': ['error', { allow: [] }],
    '@questmaestro/ban-contract-in-tests': 'error',
    '@questmaestro/ban-jest-mock-in-tests': 'error',
    '@questmaestro/ban-primitives': 'error',
    '@questmaestro/enforce-implementation-colocation': 'error',
    '@questmaestro/enforce-import-dependencies': 'error',
    '@questmaestro/enforce-jest-mocked-usage': 'error',
    '@questmaestro/enforce-object-destructuring-params': 'error',
    '@questmaestro/enforce-stub-patterns': 'error',
    '@questmaestro/enforce-project-structure': 'error',
    '@questmaestro/enforce-proxy-child-creation': 'error',
    '@questmaestro/enforce-proxy-patterns': 'error',
    '@questmaestro/enforce-test-colocation': 'error',
    '@questmaestro/enforce-test-creation-of-proxy': 'error',
    '@questmaestro/enforce-test-proxy-imports': 'error',
    '@questmaestro/explicit-return-types': 'error',
    '@questmaestro/forbid-non-exported-functions': 'error',
    '@questmaestro/jest-mocked-must-import': 'error',
    '@questmaestro/no-mutable-state-in-proxy-factory': 'error',
    '@questmaestro/require-contract-validation': 'error',
    '@questmaestro/require-zod-on-primitives': 'error',
    // Disable @typescript-eslint/no-require-imports (replaced by require-contract-validation)
    '@typescript-eslint/no-require-imports': 'off',
  } as const;

  const typescriptConfig: EslintConfig = {
    plugins: {
      ...mergedConfig.plugins,
      'eslint-comments': eslintPluginEslintCommentsAdapter as unknown,
    },
    rules: {
      ...mergedConfig.rules,
      ...(questmaestroCustomRules as unknown as DeepWritable<typeof questmaestroCustomRules>),
    },
  };

  const testConfig: EslintConfig = {
    plugins: {
      ...mergedConfig.plugins,
      'eslint-comments': eslintPluginEslintCommentsAdapter as unknown,
      ...(forTesting ? { jest: eslintPluginJestAdapter } : {}),
    },
    rules: {
      ...mergedConfig.rules,
      ...(forTesting
        ? (jestRuleStatics.rules as unknown as DeepWritable<typeof jestRuleStatics.rules>)
        : {}),
      ...(questmaestroCustomRules as unknown as DeepWritable<typeof questmaestroCustomRules>),
    },
  };

  // Stub files need to use primitives and magic numbers for type conversion
  const stubOverride: EslintConfig = {
    files: ['**/*.stub.ts', '**/*.stub.tsx'],
    rules: {
      '@typescript-eslint/no-magic-numbers': 'off',
      // // So that we can spread props as a whole object
      // '@questmaestro/enforce-object-destructuring-params': 'off',
    },
  };

  return {
    typescript: typescriptConfig,
    test: testConfig,
    fileOverrides: [stubOverride],
  };
};
