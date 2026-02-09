/**
 * PURPOSE: Defines the structure of folder configuration for project architecture rules
 *
 * USAGE:
 * const config: FolderConfig = folderConfigContract.parse({...});
 * // Returns validated folder configuration object
 */

import { z } from 'zod';

export const folderConfigContract = z.object({
  fileSuffix: z.union([
    z.string().brand<'FileSuffix'>(),
    z.array(z.string().brand<'FileSuffix'>()).readonly(),
  ]),
  exportSuffix: z.union([z.string().brand<'ExportSuffix'>(), z.literal('')]),
  exportCase: z.union([z.enum(['camelCase', 'PascalCase']), z.literal('')]),
  folderDepth: z.number().int().min(0).brand<'FolderDepth'>(),
  folderPattern: z.string().brand<'FolderPattern'>(),
  allowedImports: z.array(z.string().brand<'ImportPath'>()).readonly(),
  disallowAdhocTypes: z.boolean(),
  requireProxy: z.boolean(),
  allowsLayerFiles: z.boolean(),
  allowRegex: z.boolean(),
  requireContractDeclarations: z.boolean(),
  meta: z.object({
    purpose: z.string().brand<'FolderPurpose'>(),
    whenToUse: z.string().brand<'FolderWhenToUse'>(),
  }),
});

export type FolderConfig = z.infer<typeof folderConfigContract>;
