/**
 * PURPOSE: One wrapper a gateway barrel exports by name, with the outside calls its own file
 * makes. The census matches an adapter's outside call against these to find the gateway export
 * that already does the job.
 *
 * USAGE:
 * gatewayImplementationContract.parse({ importPath: '#gateway/node/fs__promises', name: 'readFile', moduleDir: 'fs__promises', outsideCalls: [] });
 * // Returns: GatewayImplementation
 */
import { z } from '#gateway/npm/zod';
import { exportNameContract } from '../export-name/export-name-contract';
import { gatewayModuleDirContract } from '../gateway-module-dir/gateway-module-dir-contract';
import { outsideCallContract } from '../outside-call/outside-call-contract';

export const gatewayImplementationContract = z.object({
  importPath: z.string().min(1).brand<'GatewayImplementationImportPath'>(),
  name: exportNameContract,
  moduleDir: gatewayModuleDirContract,
  outsideCalls: z.array(outsideCallContract),
});

export type GatewayImplementation = z.infer<typeof gatewayImplementationContract>;
