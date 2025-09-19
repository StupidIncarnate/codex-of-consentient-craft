import type { PreEditLintConfig } from '../../types/config-type';

export const hookConfigUtilGetRuleNames = ({ config }: { config: PreEditLintConfig }): string[] =>
  config.rules.map((rule) => (typeof rule === 'string' ? rule : rule.rule));
