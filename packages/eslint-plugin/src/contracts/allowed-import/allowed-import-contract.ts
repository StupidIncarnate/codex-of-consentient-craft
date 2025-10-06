import { z } from 'zod';
import { folderConfigStatics } from '../../statics/folder-config/folder-config-statics';

// Extract all unique allowed import values from the config
const allAllowedImports = Object.values(folderConfigStatics)
  .flatMap((config) => config.allowedImports)
  .filter((value, index, self) => self.indexOf(value) === index);

// Create enum from actual values in config
const allowedImportValues = allAllowedImports as [string, ...string[]];

export const allowedImportContract = z.enum(allowedImportValues).brand<'AllowedImport'>();

export type AllowedImport = z.infer<typeof allowedImportContract>;
