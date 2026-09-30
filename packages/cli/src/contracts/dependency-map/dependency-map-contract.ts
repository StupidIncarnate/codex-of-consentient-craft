/**
 * PURPOSE: Validates a map of package names to version strings
 *
 * USAGE:
 * const deps = dependencyMapContract.parse({'typescript': '^5.8.3'});
 * // Returns validated DependencyMap with branded types
 */

import { z } from '#gateway/npm/zod';

const dependencyKeyContract = z.string().brand<'DependencyKey'>();
const dependencyVersionContract = z.string().brand<'DependencyVersion'>();

export const dependencyMapContract = z.record(dependencyKeyContract, dependencyVersionContract);

export type DependencyMap = z.infer<typeof dependencyMapContract>;
export type DependencyKey = z.infer<typeof dependencyKeyContract>;
export type DependencyVersion = z.infer<typeof dependencyVersionContract>;
