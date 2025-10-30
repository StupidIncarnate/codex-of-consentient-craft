/**
 * PURPOSE: Merges user config with defaults, using defaults if user config is empty
 *
 * USAGE:
 * const merged = hookConfigMergeTransformer({ config: userConfig });
 * // Returns PreEditLintConfig with user rules or defaults if empty
 */
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
