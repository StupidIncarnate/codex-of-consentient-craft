/**
 * PURPOSE: A key into `eslintConfigContract`'s `plugins` record — an ESLint plugin namespace (e.g.
 * `'@typescript-eslint'`). A caller building a config with a known plugin name re-parses it through
 * this contract to index or write the branded `Record` that field returns.
 *
 * USAGE:
 * eslintPluginNameContract.parse('@typescript-eslint');
 * // Returns a branded EslintPluginName
 */
import { z } from '#gateway/npm/zod';

export const eslintPluginNameContract = z.string().brand<'EslintPluginName'>();

export type EslintPluginName = z.infer<typeof eslintPluginNameContract>;
