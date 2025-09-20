import type { PreEditLintConfig } from '../../types/config-type';

export const getRuleDisplayConfig = ({
  config,
  ruleId,
}: {
  config: PreEditLintConfig;
  ruleId: string;
}) => {
  const ruleConfig = config.rules.find((rule) => typeof rule === 'object' && rule.rule === ruleId);

  if (typeof ruleConfig === 'object') {
    return {
      displayName: ruleConfig.displayName,
      message: ruleConfig.message,
    };
  }

  return {};
};
