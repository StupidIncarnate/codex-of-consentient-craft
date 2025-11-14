/**
 * PURPOSE: Validates framework preset configurations with branded types for allowed external imports
 *
 * USAGE:
 * import {frameworkPresetsContract} from './framework-presets-contract';
 * const preset = frameworkPresetsContract.parse({...});
 * // Returns validated FrameworkPreset type with branded strings
 */

import { z } from 'zod';

const packageNameArrayContract = z.array(z.string().brand<'PackageName'>());
const nullablePackageNameArrayContract = packageNameArrayContract.nullable();

// Base preset structure - what each framework allows by default
export const frameworkPresetsContract = z.object({
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
  adapters: packageNameArrayContract,
  startup: packageNameArrayContract,
});

export type FrameworkPreset = z.infer<typeof frameworkPresetsContract>;
