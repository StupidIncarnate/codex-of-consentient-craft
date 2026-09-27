/**
 * PURPOSE: Pass-through for the Node built-in 'util/types'. Code outside the gateway imports
 * util/types through here instead of the raw module, so a future guard or override on it lands
 * in this one file and reaches every caller. `isNativeError` is one such override: the raw export
 * carries Node's own `@deprecated` tag, so this barrel replaces it with the wrapper that isolates
 * that call, the same way `fs/fs.ts` replaces `readFileSync` and its siblings.
 *
 * USAGE:
 * import { isNativeError } from '#gateway/node/util__types';
 */

export * from 'util/types';
export { isNativeError } from './is-native-error/is-native-error';
