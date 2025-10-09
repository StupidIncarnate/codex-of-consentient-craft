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
} = {}): EslintConfig => {
  // Build base configs
  const eslintConfig: EslintConfig = {
    plugins: {},
    rules: {
      ...(eslintRuleStatics.rules as unknown as DeepWritable<typeof eslintRuleStatics.rules>),
      ...(forTesting ? { 'max-depth': 'off' } : {}),
    },
  };

  const typescriptConfig: EslintConfig = {
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
    overrides: [typescriptConfig],
  });

  return {
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
      // Questmaestro custom rules
      'eslint-comments/no-unlimited-disable': 'error',
      'eslint-comments/no-use': ['error', { allow: [] }],
      '@questmaestro/ban-contract-in-tests': 'error',
      '@questmaestro/ban-primitives': 'error',
      '@questmaestro/enforce-implementation-testing': 'error',
      '@questmaestro/enforce-import-dependencies': 'error',
      '@questmaestro/enforce-object-destructuring-params': 'error',
      '@questmaestro/enforce-project-structure': 'error',
      '@questmaestro/enforce-test-colocation': 'error',
      '@questmaestro/explicit-return-types': 'error',
      '@questmaestro/forbid-non-exported-functions': 'error',
      '@questmaestro/require-contract-validation': 'error',
      '@questmaestro/require-zod-on-primitives': 'error',
      // Disable @typescript-eslint/no-require-imports (replaced by require-contract-validation)
      '@typescript-eslint/no-require-imports': 'off',
    },
  };
};
