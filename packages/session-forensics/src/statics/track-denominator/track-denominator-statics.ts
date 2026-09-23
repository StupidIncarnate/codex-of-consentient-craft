/**
 * PURPOSE: A hand-kept copy of `stepScopeStatics` from `@dungeonmaster/orchestrator`, collapsed to
 * one row per sign-off track. The copy exists because that package publishes no `statics` subpath —
 * only `.`, `./brokers` and `./testing` — and session-forensics does not depend on it at all, so
 * nothing here can import the original. Reach for this copy ONLY to measure a finished quest from
 * the outside. Anything deciding what a live session still owes must read the orchestrator's own
 * table instead — that is the one the relay runs on. Edit the two files together.
 * `trackDenominatorStatics.mirrorOf` names the file to change alongside this one.
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
 * The orchestrator's step entries carry five scope fields. Four of them fit in a table like this
 * one. Package kind (`packageTypes`) is omitted deliberately: session-forensics measures whole
 * flows from the outside and carries no package-kind filter in its coverage pipeline. Two further
 * narrowings the live relay applies have no counterpart here at all — an operation item's own flow
 * slice and package slice — because a whole-quest reading has no operation item to consult. This
 * table is also keyed by TRACK where the orchestrator's is keyed by (family, step), so
 * siegemaster's one row spans both flow types while each of its two STEPS takes `runtime` alone.
 * Every one of those gaps widens the set rather than narrowing it, so a denominator computed from
 * this table is always an upper bound on what one session owed. `get-quest-work` stays the
 * authority.
 *
 * NO TRACK LISTS `human-check`, AND THAT ABSENCE IS WHAT DROPS A HUMAN-ONLY CRITERION FROM EVERY
 * TRACK'S DENOMINATOR. A unit flagged `verifyByHuman` resolves to `human-check`; because no row
 * below declares that method, the unit is owed by nobody and never counts against a track. Adding
 * `human-check` to any row hands that track a criterion no automated check can settle. The explicit
 * element type is what makes the value expressible at all: under `as const` alone each array infers
 * its own literal tuple, so a method nothing lists has nowhere to be declared.
 *
 * USAGE:
 * trackDenominatorStatics.byTrack.flowrider.unitKinds;
 * // Returns the unit kinds counted against Flowrider — 'off-map' is absent
 */

type VerificationMethod = 'test' | 'reading' | 'human-check';

export const trackDenominatorStatics = {
  mirrorOf: 'packages/orchestrator/src/statics/step-scope/step-scope-statics.ts',
  byTrack: {
    codeweaver: {
      flowTypes: ['runtime', 'operational'],
      unitKinds: ['terminal', 'branch', 'observable'],
      observableOrigins: ['spec', 'chaoswhisperer', 'codeweaver', 'flowrider', 'operator'],
      verificationMethods: ['test', 'reading'] as readonly VerificationMethod[],
    },
    flowrider: {
      flowTypes: ['runtime'],
      unitKinds: ['terminal', 'branch', 'observable'],
      observableOrigins: ['spec', 'chaoswhisperer', 'codeweaver', 'flowrider', 'operator'],
      verificationMethods: ['test'] as readonly VerificationMethod[],
    },
    siegemaster: {
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
      verificationMethods: ['test'] as readonly VerificationMethod[],
    },
  },
} as const;
