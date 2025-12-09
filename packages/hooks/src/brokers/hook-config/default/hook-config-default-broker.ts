/**
 * PURPOSE: Retrieves default pre-edit lint configuration from dungeonmaster eslint plugin
 *
 * USAGE:
 * const defaultConfig = hookConfigDefaultBroker();
 * // Returns PreEditLintConfig with all pre-edit rules from eslint-plugin
 */
import type { PreEditLintConfig } from '../../../contracts/pre-edit-lint-config/pre-edit-lint-config-contract';
import { dungeonmasterEslintPluginGetPreEditRulesAdapter } from '../../../adapters/dungeonmaster-eslint-plugin/get-pre-edit-rules/dungeonmaster-eslint-plugin-get-pre-edit-rules-adapter';

export const hookConfigDefaultBroker = (): PreEditLintConfig =>
  dungeonmasterEslintPluginGetPreEditRulesAdapter();
