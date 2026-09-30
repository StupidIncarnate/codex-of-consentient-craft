/**
 * PURPOSE: Validates a map of package names to version strings
 *
 * USAGE:
 * const deps = dependencyMapContract.parse({'typescript': '^5.8.3'});
 * // Returns validated DependencyMap; a top-level record's keys and values are not fields, so stay plain
 */

import { z } from '#gateway/npm/zod';

export const dependencyMapContract = z.record(z.string(), z.string());

export type DependencyMap = z.infer<typeof dependencyMapContract>;
