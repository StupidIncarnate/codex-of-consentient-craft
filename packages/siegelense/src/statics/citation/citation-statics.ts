/**
 * PURPOSE: Where a citation lives and what marks one — the per-quest plan directory an operator
 * role writes preludes into, the token that makes a prelude line a `VERIFIED` one, and the
 * `questNotes` kind a walked path is recorded under. These stay OUT of `locationsStatics`: that
 * file's `no-bare-location-literals` ban is repo-wide, and `.md` is an extension every other
 * package uses for its own unrelated files. Reach for this over `evidenceFileStatics`: that one
 * names fragments of files THIS package writes, while every name here belongs to a file another
 * package's role wrote and this package only ever reads.
 *
 * USAGE:
 * citationStatics.questPlans.dirName;
 * // Returns '.quest-plans'
 *
 * citationStatics.questPlans.verifiedMarker;
 * // Returns 'VERIFIED'
 */

export const citationStatics = {
  questPlans: {
    // Created by an operator role's own Write, never by `dungeonmaster init` — see
    // `InstallRepoScaffoldResponder`, which ignores the name but deliberately does not mkdir it.
    dirName: '.quest-plans',
    preludeExtension: '.md',
    // `VERIFIED  run_7 · 2026-09-14 · prelude reached the entry, all produces: asserted`
    // (siege-verification-remainder.md line 929). The marker and the run id share ONE line, which
    // is what lets a line-by-line scan decide the question without parsing markdown.
    verifiedMarker: 'VERIFIED',
    // Plan files sit either directly under the directory or one level down in a per-quest folder
    // (`.quest-plans/1dac5395…/path-3.md`, siegelense-tooling.md line 2428). One level of
    // subdirectories covers every shape either convention produces.
    scanDepth: 1,
  },
  walked: {
    // `questNoteKindContract`'s fifth member. Compared against rather than imported, because
    // `statics/` may not import `contracts/`.
    noteKind: 'walked',
  },
} as const;
