import type { EslintConfig } from '../../../contracts/eslint-config/eslint-config-contract';
import { eslintConfigTransformer } from '../../../transformers/eslint-config/eslint-config-transformer';
import { typescriptEslintConfigTransformer } from '../../../transformers/typescript-eslint-config/typescript-eslint-config-transformer';
import { eslintConflictResolverTransformer } from '../../../transformers/eslint-conflict-resolver/eslint-conflict-resolver-transformer';
import eslintCommentsPlugin from 'eslint-plugin-eslint-comments';

export const questmaestroConfigBroker = ({
  forTesting = false,
}: {
  forTesting?: boolean;
} = {}): EslintConfig => {
  const eslintConfig = eslintConfigTransformer({ forTesting });
  const typescriptEslintConfig = typescriptEslintConfigTransformer({ forTesting });

  const mergedConfig = eslintConflictResolverTransformer({
    reference: eslintConfig,
    overrides: [typescriptEslintConfig],
  });

  return {
    plugins: { ...mergedConfig.plugins, 'eslint-comments': eslintCommentsPlugin as unknown },
    rules: {
      ...mergedConfig.rules,
      'eslint-comments/no-unlimited-disable': 'error',
      'eslint-comments/no-use': ['error', { allow: [] }],
      // '@questmaestro/ban-primitives': 'error',
      // '@questmaestro/require-zod-on-primitives': 'error',
      '@questmaestro/explicit-return-types': 'error',
      '@questmaestro/enforce-folder-structure': 'error',
    },
  };
};
