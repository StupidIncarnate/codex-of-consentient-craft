/**
 * PURPOSE: Merges user hook configuration with defaults, using defaults if user config is empty
 *
 * USAGE:
 * const merged = hookConfigMergeBroker({ config: userConfig });
 * // Returns PreEditLintConfig with user rules or defaults if empty
 */
import type { PreEditLintConfig } from '../../../contracts/pre-edit-lint-config/pre-edit-lint-config-contract';
import { hookConfigDefaultBroker } from '../default/hook-config-default-broker';

export const hookConfigMergeBroker = ({
  config,
}: {
  config: PreEditLintConfig;
}): PreEditLintConfig => {
  const defaults = hookConfigDefaultBroker();

  return {
    rules: config.rules.length > 0 ? config.rules : defaults.rules,
  };
};
