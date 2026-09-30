/**
 * PURPOSE: Defines the structure of folder configuration for project architecture rules
 *
 * USAGE:
 * const config: FolderConfig = folderConfigContract.parse({...});
 * // Returns validated folder configuration object
 */

import { z } from '#gateway/npm/zod';

export const folderConfigContract = z
  .object({
    fileSuffix: z.union([
      z.string().brand<'FolderConfigFileSuffix'>(),
      z.array(z.string().brand<'FolderConfigFileSuffix'>()).readonly(),
    ]),
    exportSuffix: z.union([z.string().brand<'FolderConfigExportSuffix'>(), z.literal('')]),
    exportCase: z.union([z.enum(['camelCase', 'PascalCase']), z.literal('')]),
    folderDepth: z.number().int().min(0).brand<'FolderConfigFolderDepth'>(),
    folderPattern: z.string().brand<'FolderConfigFolderPattern'>(),
    allowedImports: z.array(z.string().brand<'FolderConfigAllowedImports'>()).readonly(),
    disallowAdhocTypes: z.boolean(),
    requireProxy: z.boolean(),
    allowsLayerFiles: z.boolean(),
    allowRegex: z.boolean(),
    requireContractDeclarations: z.boolean(),
    testType: z.enum(['unit', 'integration', 'none']),
    requireStub: z.boolean(),
    meta: z
      .object({
        purpose: z.string().brand<'FolderConfigMetaPurpose'>(),
        whenToUse: z.string().brand<'FolderConfigMetaWhenToUse'>(),
      })
      .brand<'FolderConfigMeta'>(),
  })
  .brand<'FolderConfig'>();

export type FolderConfig = z.infer<typeof folderConfigContract>;
