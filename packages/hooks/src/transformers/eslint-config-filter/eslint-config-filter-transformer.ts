/**
 * PURPOSE: Filters ESLint config to only include rules specified in hook config
 *
 * USAGE:
 * const filtered = eslintConfigFilterTransformer({ eslintConfig, hookConfig });
 * // Returns a Linter.Config with only allowed rules enabled; a rule tagged 'pre-edit' that the host
 * // registers 'off' runs at 'error' with the host's options kept
 *
 * A pre-edit rule registered 'off' is FORCED ON so the hook blocks new violations of a rule the tree
 * is not yet clean for. `referenceEslintConfig` — the host's config for a plain source file beside
 * the edited one — is what tells that apart from a DELIBERATE per-file exemption: a rule that is on
 * for the plain file and off for this one was turned off for this kind of file (an e2e spec, an
 * integration test) and stays off, exactly as ward's own lint leaves it.
 */
import type { Linter } from '#gateway/npm/eslint';
import { isOffRuleSeverityGuard } from '../../guards/is-off-rule-severity/is-off-rule-severity-guard';
import { dungeonmasterRuleEnforceOnStatics } from '@dungeonmaster/shared/statics';
import type { PreEditLintConfig } from '../../contracts/pre-edit-lint-config/pre-edit-lint-config-contract';
import { ruleNamesExtractTransformer } from '../rule-names-extract/rule-names-extract-transformer';
import { rawEslintConfigToPartialTransformer } from '../raw-eslint-config-to-partial/raw-eslint-config-to-partial-transformer';
import { rawEslintConfigContract } from '../../contracts/raw-eslint-config/raw-eslint-config-contract';

export const eslintConfigFilterTransformer = ({
  eslintConfig,
  hookConfig,
  referenceEslintConfig,
}: {
  eslintConfig: unknown;
  hookConfig: PreEditLintConfig;
  referenceEslintConfig?: unknown;
}): Linter.Config => {
  // Transform raw ESLint config to partial config (strips language field)
  const partialConfig = rawEslintConfigToPartialTransformer({ rawConfig: eslintConfig });

  // Extract required fields from raw config (needed for ESLint to work properly)
  const parsedConfig = rawEslintConfigContract.safeParse(eslintConfig);
  const plugins: unknown = parsedConfig.success ? parsedConfig.data.plugins : undefined;
  const languageOptions: unknown = parsedConfig.success
    ? parsedConfig.data.languageOptions
    : undefined;

  const referenceRules =
    referenceEslintConfig === undefined
      ? undefined
      : rawEslintConfigToPartialTransformer({ rawConfig: referenceEslintConfig }).rules;

  // Create new config with filtered rules
  const filteredRules: Linter.RulesRecord = {};

  // Only keep allowed rules, set others to 'off'
  const eslintRules = partialConfig.rules;
  if (eslintRules !== undefined) {
    const ruleNames = ruleNamesExtractTransformer({ config: hookConfig });
    ruleNames.forEach((rule) => {
      // ESLint rules are always strings, filter out symbols
      if (typeof rule === 'string') {
        const ruleValue = eslintRules[rule];
        const isPreEditRule = Object.entries(dungeonmasterRuleEnforceOnStatics).some(
          ([name, enforceOn]) => name === rule && enforceOn === 'pre-edit',
        );
        const referenceValue = referenceRules?.[rule];
        const isExemptForThisFile =
          referenceValue !== undefined && !isOffRuleSeverityGuard({ ruleValue: referenceValue });
        const isForcedOn =
          isPreEditRule && isOffRuleSeverityGuard({ ruleValue }) && !isExemptForThisFile;
        if (ruleValue === undefined) {
          return;
        }
        if (isForcedOn) {
          const options: unknown[] = Array.isArray(ruleValue) ? ruleValue.slice(1) : [];
          filteredRules[rule] = options.length > 0 ? ['error', ...options] : 'error';
          return;
        }
        filteredRules[rule] = ruleValue as Linter.RuleEntry;
      }
    });
  }

  // Return new config with filtered rules and required ESLint fields
  const config: Linter.Config = {
    files: ['**/*.ts', '**/*.tsx'], // Ensure files pattern is set
    rules: filteredRules,
  };
  if (plugins !== undefined) {
    config.plugins = plugins as NonNullable<Linter.Config['plugins']>;
  }
  if (languageOptions !== undefined) {
    config.languageOptions = languageOptions as NonNullable<Linter.Config['languageOptions']>;
  }
  return config;
};
