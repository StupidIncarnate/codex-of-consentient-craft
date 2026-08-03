/**
 * PURPOSE: Defines one atomic blightwarden review unit — a changed file crossed with one
 * BlightConcern — carrying the paired test/proxy/stub files that collapsed onto it and the
 * human-readable statement of what the unit asserts
 *
 * USAGE:
 * blightChecklistItemContract.parse({
 *   id: 'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:coverage',
 *   implPath: 'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx',
 *   concern: 'coverage',
 *   pairedFiles: ['packages/web/src/widgets/quest-chat/quest-chat-widget.test.tsx'],
 *   label: 'coverage — every branch in quest-chat-widget.tsx has a real test',
 * });
 * // Returns: BlightChecklistItem
 *
 * Items are produced only by the checklist build path, never authored — `id` is DERIVED from
 * `implPath` + `concern` (see blightChecklistItemIdContract), so re-deriving against the same
 * changed-file set reproduces byte-identical ids. `pairedFiles` carries every test/proxy/stub file
 * that collapsed onto this impl in the diff, so a reviewer sees the whole reviewable unit rather
 * than one file at a time.
 */

import { z } from 'zod';

import { blightChecklistItemIdContract } from '../blight-checklist-item-id/blight-checklist-item-id-contract';
import { blightConcernContract } from '../blight-concern/blight-concern-contract';
import { repoRelativePathContract } from '../repo-relative-path/repo-relative-path-contract';

export const blightChecklistItemContract = z.object({
  id: blightChecklistItemIdContract,
  implPath: repoRelativePathContract,
  concern: blightConcernContract,
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
      'The human-readable statement of what this unit asserts, e.g. "coverage — every branch in comment-queue-state.ts has a real test".',
    ),
});

export type BlightChecklistItem = z.infer<typeof blightChecklistItemContract>;
