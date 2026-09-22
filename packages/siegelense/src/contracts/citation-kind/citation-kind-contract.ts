/**
 * PURPOSE: What holds evidence against a prune — a `VERIFIED` prelude, an open issue record, an open
 * quest's `WALKED` line (siegelense-tooling.md lines 256-263), and a screencast nobody has judged
 * yet. The set is CLOSED and carries `open-issue` even though nothing in this repo can resolve it
 * yet: a resolver that simply omitted the kind would answer "nothing cites this" for a question it
 * never asked, which is the quiet deletion the whole retention section exists to prevent.
 * `unjudged-screencast` is the one kind a terminal quest does NOT release — every other kind is read
 * by someone still working the quest, while that one's only reader is the person handed a list of
 * criteria no automated check can settle, once the quest is over. Reach for this over
 * `InstanceState`: a state describes what became of an INSTANCE, while a citation kind describes who
 * still needs its EVIDENCE.
 *
 * USAGE:
 * citationKindContract.parse('walked-note');
 * // Returns 'walked-note' as CitationKind
 */

import { z } from 'zod';

export const citationKindContract = z
  .enum(['verified-prelude', 'open-issue', 'walked-note', 'unjudged-screencast'])
  .brand<'CitationKind'>();

export type CitationKind = z.infer<typeof citationKindContract>;
