/**
 * PURPOSE: Extracts rule names from config, handling both string and object formats
 *
 * USAGE:
 * const ruleNames = ruleNamesExtractTransformer({ config });
 * // Returns string array of rule names like ['no-console', 'no-debugger']
 */
import type { PreEditLintConfig } from '../../contracts/pre-edit-lint-config/pre-edit-lint-config-contract';

export const ruleNamesExtractTransformer = ({ config }: { config: PreEditLintConfig }): string[] =>
  config.rules.map((rule) => (typeof rule === 'string' ? rule : rule.rule));
