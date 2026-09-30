/**
 * PURPOSE: Validates folder configuration structure for allowed external imports
 *
 * USAGE:
 * import {folderConfigContract} from './folder-config-contract';
 * const config = folderConfigContract.parse({widgets: ['react'], contracts: ['zod']});
 * // Returns validated AllowedExternalImports type
 */

import { z } from '#gateway/npm/zod';

// The computed structure that lint rules actually check
export const folderConfigContract = z
  .object({
    widgets: z.array(z.string().brand<'FolderConfigWidgets'>()).nullable(),
    bindings: z.array(z.string().brand<'FolderConfigBindings'>()).nullable(),
    state: z.array(z.string().brand<'FolderConfigState'>()).nullable(),
    flows: z.array(z.string().brand<'FolderConfigFlows'>()).nullable(),
    responders: z.array(z.string().brand<'FolderConfigResponders'>()).nullable(),
    contracts: z.array(z.string().brand<'FolderConfigContracts'>()),
    brokers: z.array(z.string().brand<'FolderConfigBrokers'>()),
    transformers: z.array(z.string().brand<'FolderConfigTransformers'>()),
    errors: z.array(z.string().brand<'FolderConfigErrors'>()),
    middleware: z.array(z.string().brand<'FolderConfigMiddleware'>()),
    startup: z.array(z.string().brand<'FolderConfigStartup'>()),
  })
  .brand<'FolderConfig'>();

export type AllowedExternalImports = z.infer<typeof folderConfigContract>;
