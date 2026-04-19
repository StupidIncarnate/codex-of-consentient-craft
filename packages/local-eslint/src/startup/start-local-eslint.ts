/**
 * PURPOSE: Initializes the local-eslint plugin by delegating to the local-eslint flow
 *
 * USAGE:
 * import { StartLocalEslint } from '@dungeonmaster/local-eslint';
 * const plugin = StartLocalEslint();
 * // Use plugin.rules in this repo's eslint.config.js
 *
 * WHEN-TO-USE: Repo-root eslint.config.js only. This plugin is never published to npm.
 */
import { LocalEslintFlow } from '../flows/local-eslint/local-eslint-flow';

type FlowResult = ReturnType<typeof LocalEslintFlow>;

export const StartLocalEslint = (): FlowResult => LocalEslintFlow();
