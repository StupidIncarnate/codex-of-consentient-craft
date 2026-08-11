/**
 * PURPOSE: Defines one atomic blightwarden review unit — a changed file crossed with one
 * BlightConcern — carrying the paired test/proxy/stub files that collapsed onto it and the
 * human-readable statement of what the unit asserts
 *
 * USAGE:
 * blightChecklistItemContract.parse({
 *   id: 'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:craft',
 *   implPath: 'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx',
 *   concern: 'craft',
 *   pairedFiles: ['packages/web/src/widgets/quest-chat/quest-chat-widget.test.tsx'],
 *   label: "craft — quest-chat-widget.tsx's logic matches its signature",
 * });
 * // Returns: BlightChecklistItem
 *
 * Items are produced only by the checklist build path, never authored — `id` is DERIVED from
 * `implPath` + `concern` (see blightChecklistItemIdContract), so re-deriving against the same
 * changed-file set reproduces byte-identical ids. `pairedFiles` carries every test/proxy/stub file
 * that collapsed onto this impl in the diff, so a reviewer sees the whole reviewable unit rather
 * than one file at a time. `packageName` is the partition key the dispatch slicing reads: two
 * groups drawn from two packages cannot share a file, which is what turns "keep the groups
 * disjoint" from an instruction into a property of the data.
 */

import { z } from 'zod';

import { blightChecklistItemIdContract } from '../blight-checklist-item-id/blight-checklist-item-id-contract';
import { blightConcernContract } from '../blight-concern/blight-concern-contract';
import { packageNameContract } from '../package-name/package-name-contract';
import { repoRelativePathContract } from '../repo-relative-path/repo-relative-path-contract';

export const blightChecklistItemContract = z.object({
  id: blightChecklistItemIdContract,
  implPath: repoRelativePathContract,
  concern: blightConcernContract,
  packageName: packageNameContract
    .optional()
    .describe(
      'The quest package entry whose `location` contains `implPath`, resolved by longest matching prefix. Absent when the path sits under none of them — a file outside every declared package, which is a real state and is owned by the residual partition group rather than assigned to a neighbour.',
    ),
  pairedFiles: z
    .array(repoRelativePathContract)
    .default([])
    .describe(
      'The test/proxy/stub files that collapsed onto this impl — the diff units a reviewer must also read to review this concern.',
    ),
  label: z
    .string()
    .min(1)
    .brand<'BlightChecklistLabel'>()
    .describe(
      'The human-readable statement of what this unit asserts, e.g. "craft — comment-queue-state.ts\'s logic matches its signature".',
    ),
});

export type BlightChecklistItem = z.infer<typeof blightChecklistItemContract>;
