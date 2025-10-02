import type { PreEditLintConfig } from '../../types/config-type';

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
