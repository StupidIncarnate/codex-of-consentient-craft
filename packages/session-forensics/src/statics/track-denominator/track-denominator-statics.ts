/**
 * PURPOSE: Mirrors `signoffTrackEligibilityStatics` from `@dungeonmaster/orchestrator`, which has no
 * root barrel and so cannot be imported across the package boundary. Reach for this ONLY to measure
 * a finished quest from the outside; anything deciding what a live session owes must read the
 * orchestrator's copy, which is the one the relay actually runs on. The two must be edited together
 * — `trackDenominatorStatics.mirrorOf` names the file to change alongside this one.
 *
 * Four of that file's six exclusions are representable here. Flow slice and package slice are the
 * other two, and both narrow by what an individual operation item declares, which a whole-quest
 * reading has no operation item to consult — so a denominator computed from this is always an upper
 * bound on what one session owed, and `get-qa-checklist` stays the authority.
 *
 * USAGE:
 * trackDenominatorStatics.byTrack.flowriderSignoff.unitKinds;
 * // Returns the unit kinds counted against Flowrider — 'off-map' is absent
 */

export const trackDenominatorStatics = {
  mirrorOf:
    'packages/orchestrator/src/statics/signoff-track-eligibility/signoff-track-eligibility-statics.ts',
  byTrack: {
    codeweaverSignoff: {
      flowTypes: ['runtime', 'operational'],
      unitKinds: ['terminal', 'branch', 'observable'],
      observableOrigins: ['spec', 'chaoswhisperer', 'codeweaver', 'flowrider', 'operator'],
      verificationMethods: ['test', 'reading'],
    },
    flowriderSignoff: {
      flowTypes: ['runtime'],
      unitKinds: ['terminal', 'branch', 'observable'],
      observableOrigins: ['spec', 'chaoswhisperer', 'codeweaver', 'flowrider', 'operator'],
      verificationMethods: ['test'],
    },
    siegemasterSignoff: {
      flowTypes: ['runtime', 'operational'],
      unitKinds: ['terminal', 'branch', 'observable', 'off-map'],
      observableOrigins: [
        'spec',
        'chaoswhisperer',
        'codeweaver',
        'flowrider',
        'siegemaster',
        'operator',
      ],
      verificationMethods: ['test'],
    },
  },
} as const;
