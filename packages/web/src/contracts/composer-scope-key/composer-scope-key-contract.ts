/**
 * PURPOSE: Identifies WHICH composer a draft belongs to — the localStorage key and the IndexedDB
 * image records are both keyed on this, so two composers (two quests, or the create surface, or
 * the same quest's spec-phase composer versus its follow-up composer) can never overwrite or
 * restore each other's drafts. Reach for this over a bare QuestId whenever a value is about to
 * become a draft-storage key: it also carries the create-surface sentinel and the follow-up
 * suffix, neither of which is a real quest id.
 *
 * USAGE:
 * composerScopeKeyContract.parse('f47ac10b-58cc-4372-a567-0e02b2c3d479');
 * // Returns: ComposerScopeKey branded string
 */

import { z } from 'zod';

export const composerScopeKeyContract = z.string().min(1).brand<'ComposerScopeKey'>();

export type ComposerScopeKey = z.infer<typeof composerScopeKeyContract>;
