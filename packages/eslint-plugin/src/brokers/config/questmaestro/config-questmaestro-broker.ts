import {
  eslintConfigContract,
  type EslintConfig,
} from '../../../contracts/eslint-config/eslint-config-contract';
import { eslintRuleStatics } from '../../../statics/eslint-rule/eslint-rule-statics';
import { typescriptEslintRuleStatics } from '../../../statics/typescript-eslint-rule/typescript-eslint-rule-statics';
import { jestRuleStatics } from '../../../statics/jest-rule/jest-rule-statics';
import { questmaestroRuleEnforceOnStatics } from '../../../statics/questmaestro-rule-enforce-on/questmaestro-rule-enforce-on-statics';
import { typescriptEslintEslintPluginLoadAdapter } from '../../../adapters/typescript-eslint-eslint-plugin/load/typescript-eslint-eslint-plugin-load-adapter';
import { eslintPluginJestLoadAdapter } from '../../../adapters/eslint-plugin-jest/load/eslint-plugin-jest-load-adapter';
import { eslintPluginEslintCommentsLoadAdapter } from '../../../adapters/eslint-plugin-eslint-comments/load/eslint-plugin-eslint-comments-load-adapter';
import { eslintConflictResolverTransformer } from '../../../transformers/eslint-conflict-resolver/eslint-conflict-resolver-transformer';

type DeepWritable<T> = T extends readonly (infer U)[]
  ? DeepWritable<U>[]
  : T extends object
    ? { -readonly [K in keyof T]: DeepWritable<T[K]> }
    : T;

export const configQuestmaestroBroker = ({
  forTesting = false,
}: {
  forTesting?: boolean;
} = {}): {
  typescript: EslintConfig;
  test: EslintConfig;
  fileOverrides: EslintConfig[];
  ruleEnforceOn: typeof questmaestroRuleEnforceOnStatics;
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

  // Questmaestro custom rules - shared by both typescript and test configs
  const questmaestroCustomRules = {
    'eslint-comments/no-unlimited-disable': 'error',
    'eslint-comments/no-use': ['error', { allow: [] }],
    '@questmaestro/ban-adhoc-types': 'error',
    '@questmaestro/ban-contract-in-tests': 'error',
    '@questmaestro/ban-jest-mock-in-tests': 'error',
    '@questmaestro/ban-primitives': [
      'error',
      {
        allowPrimitiveInputs: true,
        allowPrimitiveReturns: false,
      },
    ],
    '@questmaestro/enforce-implementation-colocation': 'error',
    '@questmaestro/enforce-import-dependencies': 'error',
    '@questmaestro/enforce-jest-mocked-usage': 'error',
    '@questmaestro/enforce-object-destructuring-params': 'error',
    '@questmaestro/enforce-optional-guard-params': 'error',
    '@questmaestro/enforce-project-structure': 'error',
    '@questmaestro/enforce-proxy-child-creation': 'error',
    '@questmaestro/enforce-proxy-patterns': 'error',
    '@questmaestro/enforce-stub-patterns': 'error',
    '@questmaestro/enforce-stub-usage': 'error',
    '@questmaestro/enforce-test-colocation': 'error',
    '@questmaestro/enforce-test-creation-of-proxy': 'error',
    '@questmaestro/enforce-test-proxy-imports': 'error',
    '@questmaestro/explicit-return-types': 'error',
    '@questmaestro/forbid-non-exported-functions': 'error',
    '@questmaestro/jest-mocked-must-import': 'error',
    '@questmaestro/no-multiple-property-assertions': 'error',
    '@questmaestro/no-mutable-state-in-proxy-factory': 'error',
    '@questmaestro/require-contract-validation': 'error',
    '@questmaestro/require-zod-on-primitives': 'error',
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
      ...(questmaestroCustomRules as unknown as DeepWritable<typeof questmaestroCustomRules>),
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
      ...(questmaestroCustomRules as unknown as DeepWritable<typeof questmaestroCustomRules>),
      // Tests have to do a bunch of sad path edge cases so these aren't helpful
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-type-assertion': 'off',
    },
  });

  // Stub files need to use primitives and magic numbers for type conversion
  const stubOverride: EslintConfig = eslintConfigContract.parse({
    files: ['**/*.stub.ts', '**/*.stub.tsx'],
    rules: {
      '@typescript-eslint/no-magic-numbers': 'off',
      // // So that we can spread props as a whole object
      // '@questmaestro/enforce-object-destructuring-params': 'off',
    },
  });

  return {
    typescript: typescriptConfig,
    test: testConfig,
    fileOverrides: [stubOverride],
    ruleEnforceOn: questmaestroRuleEnforceOnStatics,
  };
};
