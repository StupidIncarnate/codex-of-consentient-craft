/**
 * PURPOSE: What `dungeonmaster siegelense docs`'s argv parses into. `scope` is NULLABLE rather than
 * absent when `--for` is omitted, because "the whole surface" is a real request the spec names
 * first, not a missing input — so a caller reads one field for both forms. Reach for this over
 * `RecipesArgs`, which is the other selectorless listing: the two are separate shapes so a flag
 * added to one never silently becomes legal on the other.
 *
 * USAGE:
 * docsArgsContract.parse({ scope: null, human: false });
 * // Returns a validated DocsArgs meaning "serve the whole surface as JSON"
 */

import { z } from 'zod';

import { docsScopeContract } from '../docs-scope/docs-scope-contract';

export const docsArgsContract = z
  .object({
    scope: docsScopeContract.nullable(),
    human: z.boolean(),
  })
  .strict();

export type DocsArgs = z.infer<typeof docsArgsContract>;
