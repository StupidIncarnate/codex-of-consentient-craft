import type { PreEditLintConfig } from '../../types/config-type';

export const ruleNamesExtractTransformer = ({ config }: { config: PreEditLintConfig }): string[] =>
  config.rules.map((rule) => (typeof rule === 'string' ? rule : rule.rule));
