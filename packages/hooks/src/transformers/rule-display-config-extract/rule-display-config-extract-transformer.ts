/**
 * PURPOSE: Extracts display name and message from config for a specific rule
 *
 * USAGE:
 * const display = ruleDisplayConfigExtractTransformer({ config, ruleId: 'no-console' });
 * // Returns { displayName?: string, message?: string | function } for the rule
 */
import type { PreEditLintConfig } from '../../contracts/pre-edit-lint-config/pre-edit-lint-config-contract';

export const ruleDisplayConfigExtractTransformer = ({
  config,
  ruleId,
}: {
  config: PreEditLintConfig;
  ruleId: string;
}): { displayName?: string; message?: string | ((hookData: unknown) => string) } => {
  const ruleConfig = config.rules.find((rule) => typeof rule === 'object' && rule.rule === ruleId);

  if (typeof ruleConfig === 'object') {
    const result: { displayName?: string; message?: string | ((hookData: unknown) => string) } = {};

    if (ruleConfig.displayName !== undefined) {
      result.displayName = ruleConfig.displayName;
    }

    if (ruleConfig.message !== undefined) {
      result.message = ruleConfig.message;
    }

    return result;
  }

  return {};
};
