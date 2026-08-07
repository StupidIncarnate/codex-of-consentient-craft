/**
 * PURPOSE: Branded non-empty string identifying one durable side-channel note in
 * `quest.planningNotes.questNotes`
 *
 * USAGE:
 * questNoteIdContract.parse('open-question-comment-anchor-scope');
 * // Returns: QuestNoteId branded string
 *
 * WHEN-TO-USE: For the `id` on every entry a role appends to quest.planningNotes.questNotes
 * WHEN-NOT-TO-USE: For a note's subject — a note about a flow carries `flowId`, and a note about a
 * verification unit carries `unitId`; neither is the note's own identity
 *
 * Authored rather than a UUID: a role writing a note names it after what the note is about, so a
 * later pass re-stating the same open question upserts onto it instead of appending a duplicate.
 */

import { z } from 'zod';

export const questNoteIdContract = z.string().min(1).brand<'QuestNoteId'>();

export type QuestNoteId = z.infer<typeof questNoteIdContract>;
