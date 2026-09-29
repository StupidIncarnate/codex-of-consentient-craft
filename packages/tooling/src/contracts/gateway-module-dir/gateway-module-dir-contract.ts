/**
 * PURPOSE: The folder name a gateway gives a module, such as `fs__promises` for `fs/promises`, under `packages/@gateway/<kind>/src/`.
 *
 * USAGE:
 * gatewayModuleDirContract.parse('fs__promises');
 * // Returns: GatewayModuleDir (branded string)
 */
import { z } from '#gateway/npm/zod';

export const gatewayModuleDirContract = z.string().min(1).brand<'GatewayModuleDir'>();

export type GatewayModuleDir = z.infer<typeof gatewayModuleDirContract>;
