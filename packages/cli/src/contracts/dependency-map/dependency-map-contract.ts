/**
 * PURPOSE: Validates a map of package names to version strings
 *
 * USAGE:
 * const deps = dependencyMapContract.parse({'typescript': '^5.8.3'});
 * // Returns validated DependencyMap with branded types
 */

import { z } from 'zod';

export const dependencyMapContract = z.record(
  z.string().brand<'DependencyKey'>(),
  z.string().brand<'DependencyVersion'>(),
);

export type DependencyMap = z.infer<typeof dependencyMapContract>;
export type DependencyKey = z.infer<typeof dependencyMapContract.keySchema>;
export type DependencyVersion = z.infer<typeof dependencyMapContract.valueSchema>;
