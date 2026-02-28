/**
 * PURPOSE: Initializes the ESLint plugin by delegating to the eslint-plugin flow
 *
 * USAGE:
 * import { StartEslintPlugin } from '@dungeonmaster/eslint-plugin';
 * const plugin = StartEslintPlugin();
 * // Use plugin.rules in ESLint config
 * // Use plugin.configs.dungeonmaster for pre-configured rulesets
 *
 * WHEN-TO-USE: When setting up ESLint to use Dungeonmaster custom rules
 */
import { EslintPluginFlow } from '../flows/eslint-plugin/eslint-plugin-flow';

type FlowResult = ReturnType<typeof EslintPluginFlow>;

export const StartEslintPlugin = (): FlowResult => EslintPluginFlow();
