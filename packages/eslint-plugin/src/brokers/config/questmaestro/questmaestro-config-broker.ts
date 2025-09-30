import type { EslintConfig } from '../../../contracts/eslint-config/eslint-config-contract';
import { questmaestroConfigEslintBroker } from '../eslint/questmaestro-config-eslint-broker';
import { questmaestroConfigTypescriptEslintBroker } from '../typescript-eslint/questmaestro-config-typescript-eslint-broker';
import { eslintConflictResolverTransformer } from '../../../transformers/eslint-conflict-resolver/eslint-conflict-resolver-transformer';

export const questmaestroConfigBroker = ({
  forTesting = false,
}: {
  forTesting?: boolean;
} = {}): EslintConfig => {
  const eslintConfig = questmaestroConfigEslintBroker({ forTesting });
  const typescriptEslintConfig = questmaestroConfigTypescriptEslintBroker({ forTesting });

  const mergedConfig = eslintConflictResolverTransformer({
    reference: eslintConfig,
    overrides: [typescriptEslintConfig],
  });

  return {
    plugins: mergedConfig.plugins,
    rules: {
      ...mergedConfig.rules,
      // '@questmaestro/ban-primitives': 'error',
      // '@questmaestro/require-zod-on-primitives': 'error',
      // '@questmaestro/explicit-return-types': 'error',
      // '@questmaestro/enforce-folder-structure': 'error',
      // '@typescript-eslint/ban-types': [
      //   'error',
      //   {
      //     Types: {
      //       String: 'Use Zod contract types like EmailAddress, UserName, FilePath, etc.',
      //       Number: 'Use Zod contract types like Currency, PositiveNumber, Age, etc.',
      //       String: 'Use Zod contract types instead of String constructor',
      //       Number: 'Use Zod contract types instead of Number constructor',
      //     },
      //     ExtendDefaults: true,
      //   },
      // ],
      // 'no-restricted-syntax': [
      //   'error',
      //   {
      //     Selector:
      //       'CallExpression[callee.object.name="z"][callee.property.name="string"]:not(:has(MemberExpression[property.name="brand"]))',
      //     Message:
      //       "z.string() must be chained with .brand() - use z.string().email().brand<'EmailAddress'>() instead of z.string().email()",
      //   },
      //   {
      //     Selector:
      //       'CallExpression[callee.object.name="z"][callee.property.name="number"]:not(:has(MemberExpression[property.name="brand"]))',
      //     Message:
      //       "z.number() must be chained with .brand() - use z.number().positive().brand<'PositiveNumber'>() instead of z.number().positive()",
      //   },
      // ],
    },
  };
};
