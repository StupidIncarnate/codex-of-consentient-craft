import type { PreEditLintConfig } from '../../types/config-type';
import { hookConfigUtilGetDefaultConfig } from './hook-config-util-get-default-config';

export const hookConfigUtilMergeWithDefaults = ({
  config,
}: {
  config: PreEditLintConfig;
}): PreEditLintConfig => {
  const defaults = hookConfigUtilGetDefaultConfig();

  return {
    rules: config.rules || defaults.rules,
  };
};
