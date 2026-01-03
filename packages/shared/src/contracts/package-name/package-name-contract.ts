/**
 * PURPOSE: Zod schema for validating package names
 *
 * USAGE:
 * const name = packageNameContract.parse('@dungeonmaster/shared');
 * // Returns branded PackageName type for npm package identifiers
 */

import { z } from 'zod';

/**
 * Represents a valid npm package name
 * Used for identifying installable packages in the dungeonmaster init system
 */
export const packageNameContract = z.string().min(1).brand<'PackageName'>();

export type PackageName = z.infer<typeof packageNameContract>;
