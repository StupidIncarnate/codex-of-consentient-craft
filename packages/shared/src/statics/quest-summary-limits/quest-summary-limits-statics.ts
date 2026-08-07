/**
 * PURPOSE: Bounds what `questSummaryToTextTransformer` renders — how many entries each section
 * shows, and the hard character ceiling the whole render is cut at — so a pathological quest cannot
 * blow the MCP tool-result budget
 *
 * USAGE:
 * questSummaryLimitsStatics.maxUnconfirmable;
 * // Returns the cap on rendered `unconfirmable` entries before that section truncates
 *
 * TWO BOUNDS, BECAUSE ONE IS NOT ENOUGH. The four `max*` counts are the INFORMATIVE bound: when a
 * section overflows, the reader is told how many ENTRIES were dropped, which is a number they can
 * act on. `maxRenderChars` is the GUARANTEED one: the counts multiplied by their measured per-entry
 * cost do NOT by themselves fit under the ceiling — 80 unconfirmable entries alone run about 45,000
 * characters — and free text is author-written, so only a character cut can actually promise the
 * result is delivered verbatim. The counts are therefore set where a real quest never trips them,
 * and the character ceiling catches everything they do not.
 *
 * ENTRY COUNT IS THE KNOB FOR THE SECTION CAPS, not prose length, because every free-text field a
 * summary carries is contract-governed to one short span: `signoffContract.evidence` is a test
 * `file:line` plus the break that reds it (or the value read off the running system),
 * `signoffContract.question` is one routable sentence, `questNoteContract.summary` is "the one line
 * a reader scans", and an observable's `description` is a single GIVEN/WHEN/THEN outcome. Capping
 * prose per field would cut the very sentence this render exists to route.
 * `blightChecklistLimitsStatics` sizes on the same knob for the same reason.
 *
 * MEASURED AGAINST THE LARGEST REALISTIC QUEST: 7 flows carrying 281 verification units, 26
 * mid-quest observables, 35 unconfirmable verdicts and 24 notes
 * (`quest-summary-to-text-transformer.test.ts`, `describe('scale — a real quest-sized summary')`).
 * That renders at 42,096 characters — under `mcpToolResultStatics.maxVerbatimChars` (50,000) and
 * under `maxRenderChars`, with no section truncated. Each section cap sits at least twice its
 * measured real-world load, so the informative bound stays quiet on real data.
 *
 * `maxRenderChars` sits below `maxVerbatimChars` by enough to carry its own truncation notice
 * (~250 characters) and to absorb dense markdown tokenizing worse than the four-characters-per-token
 * estimate `maxVerbatimChars` is itself derived from.
 *
 * TRUNCATING IS SAFE, NOT MERELY TOLERABLE. This render is a REPORT, never a gate: nothing
 * downstream computes completion from it (`quest-handle-signal-back-responder` recomputes the
 * outstanding set server-side from the quest file). A truncated render can under-inform a reader,
 * which the loud notices and their exact dropped counts make visible; it can never let an unsigned
 * unit pass for a signed one. The section order — coverage, drift, unconfirmable, notes — is also
 * the priority order, so a character cut eats the notes before it reaches the routing surface.
 */

export const questSummaryLimitsStatics = {
  maxFlows: 40,
  maxMidQuestObservables: 80,
  maxUnconfirmable: 80,
  maxNotesPerKind: 40,
  maxRenderChars: 48_000,
} as const;
