/**
 * PURPOSE: An ESLint plugin namespace (e.g. `'@typescript-eslint'`), the key of a flat config's
 * `plugins` record. A caller with a known plugin name parses it through this contract.
 *
 * USAGE:
 * eslintPluginNameContract.parse('@typescript-eslint');
 * // Returns a branded EslintPluginName
 */
import { z } from '#gateway/npm/zod';

export const eslintPluginNameContract = z.string().brand<'EslintPluginName'>();

export type EslintPluginName = z.infer<typeof eslintPluginNameContract>;
