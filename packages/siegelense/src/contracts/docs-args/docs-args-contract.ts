/**
 * PURPOSE: What `dungeonmaster siegelense docs`'s argv parses into. `--for` is OPTIONAL:
 * `scope` is null for the bare call, which serves the tool's about overview alone rather than
 * one role's manual. Reach for this over `RecipesArgs`, which is the other selectorless listing:
 * the two are separate shapes so a flag added to one never silently becomes legal on the other.
 *
 * USAGE:
 * docsArgsContract.parse({ scope: null, isJson: false });
 * // Returns a validated DocsArgs meaning "serve the about overview alone, as Markdown"
 *
 * docsArgsContract.parse({ scope: 'walking', isJson: true });
 * // Returns a validated DocsArgs meaning "serve the walker's instructions as JSON"
 */

import { z } from 'zod';

import { docsScopeContract } from '../docs-scope/docs-scope-contract';

export const docsArgsContract = z
  .object({
    scope: docsScopeContract.nullable(),
    isJson: z.boolean(),
  })
  .strict();

export type DocsArgs = z.infer<typeof docsArgsContract>;
