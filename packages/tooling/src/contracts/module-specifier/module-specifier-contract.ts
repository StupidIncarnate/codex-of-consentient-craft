/**
 * PURPOSE: The text between the quotes of an import or re-export, exactly as written.
 *
 * USAGE:
 * moduleSpecifierContract.parse('fs/promises');
 * // Returns: ModuleSpecifier (branded string)
 */
import { z } from '#gateway/npm/zod';

export const moduleSpecifierContract = z.string().min(1).brand<'ModuleSpecifier'>();

export type ModuleSpecifier = z.infer<typeof moduleSpecifierContract>;
