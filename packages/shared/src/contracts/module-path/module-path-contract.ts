import { z } from 'zod';

/**
 * Represents a module path used in import/require statements
 * Can be:
 * - npm package names: 'axios', '@questmaestro/shared'
 * - relative paths: './my-module', '../utils'
 * - absolute paths: '/usr/local/lib/module'
 */
export const modulePathContract = z.string().brand<'ModulePath'>();

export type ModulePath = z.infer<typeof modulePathContract>;
