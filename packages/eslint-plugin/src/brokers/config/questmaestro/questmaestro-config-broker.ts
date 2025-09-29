import type { EslintConfig } from '../../../contracts/eslint-config/eslint-config-contract';
import { questmaestroConfigEslintBroker } from '../eslint/questmaestro-config-eslint-broker';
import { questmaestroConfigTypescriptEslintBroker } from '../typescript-eslint/questmaestro-config-typescript-eslint-broker';
import { eslintConflictResolverTransformer } from '../../../transformers/eslint-conflict-resolver/eslint-conflict-resolver-transformer';

export const questmaestroConfigBroker = (): EslintConfig => {
  const eslintConfig = questmaestroConfigEslintBroker();
  const typescriptEslintConfig = questmaestroConfigTypescriptEslintBroker();

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
      //     types: {
      //       string: 'Use Zod contract types like EmailAddress, UserName, FilePath, etc.',
      //       number: 'Use Zod contract types like Currency, PositiveNumber, Age, etc.',
      //       String: 'Use Zod contract types instead of String constructor',
      //       Number: 'Use Zod contract types instead of Number constructor',
      //     },
      //     extendDefaults: true,
      //   },
      // ],
      // 'no-restricted-syntax': [
      //   'error',
      //   {
      //     selector:
      //       'CallExpression[callee.object.name="z"][callee.property.name="string"]:not(:has(MemberExpression[property.name="brand"]))',
      //     message:
      //       "z.string() must be chained with .brand() - use z.string().email().brand<'EmailAddress'>() instead of z.string().email()",
      //   },
      //   {
      //     selector:
      //       'CallExpression[callee.object.name="z"][callee.property.name="number"]:not(:has(MemberExpression[property.name="brand"]))',
      //     message:
      //       "z.number() must be chained with .brand() - use z.number().positive().brand<'PositiveNumber'>() instead of z.number().positive()",
      //   },
      // ],
    },
  };
};
