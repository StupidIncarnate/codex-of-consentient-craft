import type { PreEditLintConfig } from '../../contracts/pre-edit-lint-config/pre-edit-lint-config-contract';
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
