/**
 * PURPOSE: The four knobs `capacity` divides by — the policy ceiling, the memory it refuses to
 * spend, the pool size it falls back to with no measured profile, and the spec a bare `capacity`
 * answers for. Reach for this over `instanceLifecycleStatics` when the value decides HOW MANY
 * instances may exist at once; that file decides how long one of them may take to get there.
 *
 * `defaults.specName` is derived from `laneSpecStatics` rather than typed, so a renamed spec moves
 * both places at once.
 *
 * USAGE:
 * capacityStatics.policy.ceiling;
 * // Returns 3 — the policy cap `suggested` is never above
 *
 * capacityStatics.memory.headroomMB;
 * // Returns 512 — subtracted from free memory before anything is divided
 */

import { laneSpecStatics } from '../lane-spec/lane-spec-statics';

export const capacityStatics = {
  policy: {
    // siegelense-tooling.md line 1581: "the POLICY cap — a knob, three here, not a fact about
    // anything". instanceLifecycleStatics already reasons against this same three in three of its
    // own comments (ids.entropyBytes, bootLock.waitCeilingMs, ports.claimAttempts); this is where
    // the number itself lives.
    ceiling: 3,
  },
  memory: {
    // What free memory is NOT available to divide. 512MB is what makes the spec's own worked
    // example come out at its stated answer (line 1571-1574): free 5320 less 512 is 4808, and
    // (4808 - 2600) / 1800 floored is 1, plus the one instance that is itself at peak, is 2 —
    // against a ceiling of 3 with one instance already up. A knob, not a fact.
    headroomMB: 512,
  },
  noProfile: {
    // siegelense-tooling.md line 1517: "With no profile, `suggested` is TWO." A fresh spec has no
    // numbers, so the first pair runs and profiles itself — two samples rather than one, and a
    // first pass that is not needlessly serial. Pragmatic rather than derived, and the failure
    // when it is wrong is slowness rather than corruption.
    suggested: 2,
  },
  defaults: {
    // The browsered spec, and the more expensive of the two built-ins, so a bare `capacity` with
    // no --spec answers conservatively. Read off laneSpecStatics rather than typed so the name
    // cannot drift from the spec it points at.
    specName: laneSpecStatics.specs['dungeonmaster-web'].name,
  },
} as const;
