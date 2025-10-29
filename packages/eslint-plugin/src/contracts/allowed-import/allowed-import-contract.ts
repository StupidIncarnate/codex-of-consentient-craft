import { z } from 'zod';
import { folderConfigStatics } from '../../statics/folder-config/folder-config-statics';

/**
 * PURPOSE: Validates allowed import patterns dynamically extracted from folder configuration statics
 *
 * USAGE:
 * const importType = allowedImportContract.parse('npm-package');
 * // Returns branded AllowedImport type (e.g., 'npm-package', 'relative', 'contract-only')
 */

// Extract all unique allowed import values from the config
const allAllowedImports = Object.values(folderConfigStatics)
  .flatMap((config) => config.allowedImports)
  .filter((value, index, self) => self.indexOf(value) === index);

// Ensure array is non-empty and build tuple for z.enum()
if (allAllowedImports.length === 0) {
  throw new Error('folderConfigStatics must have at least one allowedImport value');
}

// Create enum from actual values
const [first, ...rest] = allAllowedImports;

if (!first) {
  throw new Error('Failed to extract first allowedImport value');
}

export const allowedImportContract = z.enum([first, ...rest]).brand<'AllowedImport'>();

export type AllowedImport = z.infer<typeof allowedImportContract>;
