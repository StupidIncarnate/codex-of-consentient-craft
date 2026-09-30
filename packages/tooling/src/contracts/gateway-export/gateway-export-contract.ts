/**
 * PURPOSE: A gateway export that already does what an adapter's one outside call does. `exact`
 * is the same function under the same name in the same module; `related` is a gateway wrapper
 * whose own implementation calls that outside function (`statIfExists` for `stat`), so a person
 * still has to check the wrapper fits.
 *
 * USAGE:
 * gatewayExportContract.parse({ importPath: '#gateway/node/fs__promises', name: 'readFile', match: 'exact' });
 * // Returns: GatewayExport
 */
import { z } from '#gateway/npm/zod';
import { exportNameContract } from '../export-name/export-name-contract';

export const gatewayExportContract = z.object({
  importPath: z.string().min(1).brand<'GatewayExportImportPath'>(),
  name: exportNameContract,
  match: z.enum(['exact', 'related']),
});

export type GatewayExport = z.infer<typeof gatewayExportContract>;
