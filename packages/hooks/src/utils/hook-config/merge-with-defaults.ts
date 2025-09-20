import type { PreEditLintConfig } from '../../types/config-type';
import { getDefaultConfig } from './get-default-config';

export const mergeWithDefaults = ({ config }: { config: PreEditLintConfig }): PreEditLintConfig => {
  const defaults = getDefaultConfig();

  return {
    rules: config.rules || defaults.rules,
  };
};
