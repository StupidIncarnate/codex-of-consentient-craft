/**
 * PURPOSE: Transforms raw ESLint config to partial config by extracting only rules field
 *
 * USAGE:
 * const partial = rawEslintConfigToPartialTransformer({ rawConfig });
 * // Returns PartialEslintConfig with rules field, language field stripped
 */
import { partialEslintConfigContract } from '../../contracts/partial-eslint-config/partial-eslint-config-contract';
import type { PartialEslintConfig } from '../../contracts/partial-eslint-config/partial-eslint-config-contract';

export const rawEslintConfigToPartialTransformer = ({
  rawConfig,
}: {
  rawConfig: unknown;
}): PartialEslintConfig => {
  // Extract only the rules field from raw config, ignoring language and other fields
  if (typeof rawConfig !== 'object' || rawConfig === null) {
    return partialEslintConfigContract.parse({});
  }

  const rulesValue: unknown = Reflect.get(rawConfig, 'rules');

  if (typeof rulesValue !== 'object' || rulesValue === null || Array.isArray(rulesValue)) {
    return partialEslintConfigContract.parse({});
  }

  return partialEslintConfigContract.parse({
    rules: rulesValue,
  });
};
