/**
 * PURPOSE: One call an adapter makes into something the repo does not own: a bare npm or Node
 * import, a global, or a gateway export. `module` is the import specifier, or the global's own
 * name; the census matches gateway exports on that pair.
 *
 * USAGE:
 * outsideCallContract.parse({ module: 'fs/promises', name: 'readFile' });
 * // Returns: OutsideCall
 */
import { z } from '#gateway/npm/zod';
import { moduleSpecifierContract } from '../module-specifier/module-specifier-contract';
import { exportNameContract } from '../export-name/export-name-contract';

export const outsideCallContract = z.object({
  module: moduleSpecifierContract,
  name: exportNameContract,
});

export type OutsideCall = z.infer<typeof outsideCallContract>;
