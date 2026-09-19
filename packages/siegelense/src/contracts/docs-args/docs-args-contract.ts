/**
 * PURPOSE: What `dungeonmaster siegelense docs`'s argv parses into. `--for` is REQUIRED,
 * specifying the role whose instructions to read. Reach for this over `RecipesArgs`, which
 * is the other selectorless listing: the two are separate shapes so a flag added to one
 * never silently becomes legal on the other.
 *
 * USAGE:
 * docsArgsContract.parse({ scope: 'operating', json: false, human: false });
 * // Returns a validated DocsArgs meaning "serve the operating instructions as Markdown"
 *
 * docsArgsContract.parse({ scope: 'walking', json: true, human: false });
 * // Returns a validated DocsArgs meaning "serve the walker's instructions as JSON"
 */

import { z } from 'zod';

import { docsScopeContract } from '../docs-scope/docs-scope-contract';

export const docsArgsContract = z
  .object({
    scope: docsScopeContract,
    json: z.boolean(),
  })
  .strict();

export type DocsArgs = z.infer<typeof docsArgsContract>;
