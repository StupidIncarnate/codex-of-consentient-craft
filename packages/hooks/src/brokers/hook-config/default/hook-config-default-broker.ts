/**
 * PURPOSE: Retrieves default pre-edit lint configuration from questmaestro eslint plugin
 *
 * USAGE:
 * const defaultConfig = hookConfigDefaultBroker();
 * // Returns PreEditLintConfig with all pre-edit rules from eslint-plugin
 */
import type { PreEditLintConfig } from '../../../contracts/pre-edit-lint-config/pre-edit-lint-config-contract';
import { questmaestroEslintPluginGetPreEditRulesAdapter } from '../../../adapters/questmaestro-eslint-plugin/get-pre-edit-rules/questmaestro-eslint-plugin-get-pre-edit-rules-adapter';

export const hookConfigDefaultBroker = (): PreEditLintConfig =>
  questmaestroEslintPluginGetPreEditRulesAdapter();
