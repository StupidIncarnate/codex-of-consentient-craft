/**
 * PURPOSE: A hand-kept copy of `signoffTrackEligibilityStatics` from `@dungeonmaster/orchestrator`.
 * The copy exists because that package has no root barrel, so nothing outside it can import the
 * original. Reach for this copy ONLY to measure a finished quest from the outside. Anything
 * deciding what a live session still owes must read the orchestrator's copy instead — that is the
 * one the relay runs on. Edit the two files together. `trackDenominatorStatics.mirrorOf` names the
 * file to change alongside this one.
 *
 * The words this table uses, once each:
 * - flow: one graph of work inside a quest — nodes, edges, and the sign-offs recorded on them.
 * - unit: one signable thing in a flow graph.
 * - sign-off track: one reviewing role that signs work off — codeweaver, flowrider or siegemaster.
 * - observable: something a node says a reader should be able to see.
 * - off-map family: one of the standing check categories siegemaster runs outside the flow graph.
 * - operator: one of the agent roles that runs a quest step. It can author an observable.
 * - denominator: how many units a track was owed a sign-off on, the bottom half of the coverage
 *   fraction.
 *
 * The orchestrator file lists six exclusions. Four of them fit in a table like this one. The two
 * that do not are flow slice and package slice. Both narrow by what a single operation item
 * declares, and a whole-quest reading has no operation item to consult. So a denominator computed
 * from this table is always an upper bound on what one session owed. `get-qa-checklist` stays the
 * authority.
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
