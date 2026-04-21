/**
 * PURPOSE: Main entry point for the private @dungeonmaster/local-eslint package exporting repo-local ESLint rules.
 *
 * USAGE:
 * import plugin from '@dungeonmaster/local-eslint';
 * // Returns ESLint plugin with repo-local rules (never shipped to consumers)
 */
import { StartLocalEslint } from './startup/start-local-eslint';

export { StartLocalEslint } from './startup/start-local-eslint';

// Default export for standard ESLint plugin usage
const plugin = StartLocalEslint();
export default plugin;
