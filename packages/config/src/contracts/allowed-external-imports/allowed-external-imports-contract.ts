/**
 * PURPOSE: Validates folder configuration structure for allowed external imports
 *
 * USAGE:
 * import {allowedExternalImportsContract} from './allowed-external-imports-contract';
 * const config = allowedExternalImportsContract.parse({widgets: ['react'], contracts: ['zod']});
 * // Returns validated AllowedExternalImports type
 */

import { z } from '#gateway/npm/zod';

// The computed structure that lint rules actually check
export const allowedExternalImportsContract = z
  .object({
    widgets: z.array(z.string().brand<'AllowedExternalImportsWidgets'>()).nullable(),
    bindings: z.array(z.string().brand<'AllowedExternalImportsBindings'>()).nullable(),
    state: z.array(z.string().brand<'AllowedExternalImportsState'>()).nullable(),
    flows: z.array(z.string().brand<'AllowedExternalImportsFlows'>()).nullable(),
    responders: z.array(z.string().brand<'AllowedExternalImportsResponders'>()).nullable(),
    contracts: z.array(z.string().brand<'AllowedExternalImportsContracts'>()),
    brokers: z.array(z.string().brand<'AllowedExternalImportsBrokers'>()),
    transformers: z.array(z.string().brand<'AllowedExternalImportsTransformers'>()),
    errors: z.array(z.string().brand<'AllowedExternalImportsErrors'>()),
    middleware: z.array(z.string().brand<'AllowedExternalImportsMiddleware'>()),
    startup: z.array(z.string().brand<'AllowedExternalImportsStartup'>()),
  })
  .brand<'AllowedExternalImports'>();

export type AllowedExternalImports = z.infer<typeof allowedExternalImportsContract>;
