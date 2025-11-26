/**
 * PURPOSE: Proxy for fs-exists-sync-adapter that mocks fs.existsSync
 *
 * USAGE:
 * const proxy = fsExistsSyncAdapterProxy();
 * proxy.returnsTrue({filePath});
 * // Sets up mock to return true for the given file path
 */

/**
 * Empty proxy - fs.existsSync uses real implementation
 * This prevents module corruption issues when mocking built-in fs module
 */
export const fsExistsSyncAdapterProxy = (): Record<PropertyKey, never> => ({});
