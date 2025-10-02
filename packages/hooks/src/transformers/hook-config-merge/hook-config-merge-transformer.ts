import type { PreEditLintConfig } from '../../types/config-type';
import { hookConfigDefaultTransformer } from '../hook-config-default/hook-config-default-transformer';

export const hookConfigMergeTransformer = ({
  config,
}: {
  config: PreEditLintConfig;
}): PreEditLintConfig => {
  const defaults = hookConfigDefaultTransformer();

  return {
    rules: config.rules.length > 0 ? config.rules : defaults.rules,
  };
};
