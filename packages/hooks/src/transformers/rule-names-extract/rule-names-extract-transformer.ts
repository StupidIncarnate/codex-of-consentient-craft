import type { PreEditLintConfig } from '../../contracts/pre-edit-lint-config/pre-edit-lint-config-contract';

export const ruleNamesExtractTransformer = ({ config }: { config: PreEditLintConfig }): string[] =>
  config.rules.map((rule) => (typeof rule === 'string' ? rule : rule.rule));
