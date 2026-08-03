/**
 * PURPOSE: Defines the branded, DERIVED identifier for one blightwarden review unit —
 * `<repo-relative-impl-path>:<concern>`, a changed file crossed with one BlightConcern
 *
 * USAGE:
 * blightChecklistItemIdContract.parse('packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:coverage');
 * // Returns: BlightChecklistItemId branded string
 *
 * This id is DERIVED from the changed-file set, never minted or authored — re-deriving it against
 * the same file set reproduces byte-identical ids. That is what lets a later session resume against
 * the ledger a predecessor actually landed instead of re-deriving its whole pass from prose in a
 * commit body.
 */

import { z } from 'zod';

export const blightChecklistItemIdContract = z.string().min(1).brand<'BlightChecklistItemId'>();

export type BlightChecklistItemId = z.infer<typeof blightChecklistItemIdContract>;
