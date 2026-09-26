/**
 * PURPOSE: Validates a tsconfig `compilerOptions.paths` map — each specifier resolving to an
 * ordered list of candidate targets, the shape every gateway `paths` entry this install step
 * computes or reads back takes.
 *
 * USAGE:
 * const paths = tsconfigPathsMapContract.parse({'#gateway/npm/*': ['./packages/@gateway/npm/src/DOMAIN/index.ts']});
 * // Returns validated TsconfigPathsMap with branded key/value types
 */

import { z } from 'zod';

export const tsconfigPathsMapContract = z.record(
  z.string().brand<'TsconfigPathsKey'>(),
  z.array(z.string().brand<'TsconfigPathsValue'>()),
);

export type TsconfigPathsMap = z.infer<typeof tsconfigPathsMapContract>;
