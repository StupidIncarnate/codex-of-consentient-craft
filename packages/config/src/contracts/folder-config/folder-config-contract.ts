/**
 * PURPOSE: Validates folder configuration structure for allowed external imports
 *
 * USAGE:
 * import {folderConfigContract} from './folder-config-contract';
 * const config = folderConfigContract.parse({widgets: ['react'], contracts: ['zod']});
 * // Returns validated AllowedExternalImports type
 */

import { z } from '#gateway/npm/zod';

const packageNameArrayContract = z.array(z.string().brand<'PackageName'>());
const nullablePackageNameArrayContract = packageNameArrayContract.nullable();

// The computed structure that lint rules actually check
export const allowedExternalImportsContract = z.object({
  widgets: nullablePackageNameArrayContract,
  bindings: nullablePackageNameArrayContract,
  state: nullablePackageNameArrayContract,
  flows: nullablePackageNameArrayContract,
  responders: nullablePackageNameArrayContract,
  contracts: packageNameArrayContract,
  brokers: packageNameArrayContract,
  transformers: packageNameArrayContract,
  errors: packageNameArrayContract,
  middleware: packageNameArrayContract,
  startup: packageNameArrayContract,
}).brand<'AllowedExternalImports'>();

export type AllowedExternalImports = z.infer<typeof allowedExternalImportsContract>;
