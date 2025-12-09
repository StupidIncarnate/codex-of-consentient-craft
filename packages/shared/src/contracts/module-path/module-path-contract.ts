/**
 * PURPOSE: Zod schema for validating module paths used in import/require statements
 *
 * USAGE:
 * const modulePath = modulePathContract.parse('@dungeonmaster/shared');
 * // Returns branded ModulePath type for npm packages, relative paths, or absolute paths
 */

import { z } from 'zod';

/**
 * Represents a module path used in import/require statements
 * Can be:
 * - npm package names: 'axios', '@dungeonmaster/shared'
 * - relative paths: './my-module', '../utils'
 * - absolute paths: '/usr/local/lib/module'
 */
export const modulePathContract = z.string().brand<'ModulePath'>();

export type ModulePath = z.infer<typeof modulePathContract>;
