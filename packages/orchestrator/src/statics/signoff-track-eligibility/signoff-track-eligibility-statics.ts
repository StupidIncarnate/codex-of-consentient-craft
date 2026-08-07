/**
 * PURPOSE: What each verification track's denominator INCLUDES — the flow types it measures, the
 * unit kinds it owns, and the observable provenances it could ever have signed
 *
 * USAGE:
 * signoffTrackEligibilityStatics.byTrack.flowrider.unitKinds;
 * // Returns the unit kinds counted against Flowrider — off-map is absent
 * signoffTrackEligibilityStatics.byTrack.flowrider.observableOrigins;
 * // Returns the origins Flowrider could have signed — `siegemaster` is absent
 * signoffTrackEligibilityStatics.byTrack.flowrider.flowTypes;
 * // Returns the flow types Flowrider is measured over — `operational` is absent
 *
 * THREE SEPARATE EXCLUSIONS live here as DATA so the completion gate carries no role branches of
 * its own.
 *
 * 0. FLOW TYPE. An operational flow is a one-time task sequence whose end state is hand-checked;
 *    there is nothing repeatable for a flow-perspective suite to assert, so Flowrider is measured
 *    over `runtime` flows alone. Siegemaster verifies both, which is why it carries the full list
 *    rather than an absent field: "measures every type" is a statement, not a default.
 *
 * 1. UNIT KIND. The off-map probe families are Siegemaster's charter: they are the breakage classes
 *    a flow graph structurally cannot draw, probed by hand against a running system, which is not
 *    what a Flowrider test suite is for. Counting them against Flowrider would report a hole no
 *    Flowrider session could ever close.
 *
 * 2. PROVENANCE. A role that runs strictly AFTER a track cannot produce work that track was able to
 *    sign. The relay order is derived from `questTypeRegistryStatics.feature`: the intake role is
 *    `chaoswhisperer`, which also authors the `codeweaver` operation items at spec time
 *    (`startImplementationOps` is empty for a feature quest), and `relayTail` runs
 *    ward → flowrider → siegemaster → blightwarden → ward. `questBuildRelayGraphBroker`
 *    concatenates them as `[...settledExisting, ...implementationOps, ...tailOps]`, giving:
 *
 *        spec (present at approval) → chaoswhisperer → codeweaver → flowrider → siegemaster
 *
 *    So an observable with `addedBy: 'siegemaster'` is excluded from Flowrider's denominator and
 *    nothing else is. `operator` is out-of-band — a human writing an observable in at any point —
 *    and counts for both tracks, as does `spec`.
 *
 * `questTypeRegistryStatics['bug-hunt'].relayTail` carries neither operator role, so neither
 * track's gate ever binds on a bug-hunt quest.
 *
 * This is DATA only (statics may import statics, never contracts). `unitKinds` stays 1:1 with
 * `qaChecklistKindContract`'s options, the siegemaster `observableOrigins` 1:1 with
 * `observableOriginContract`'s options, and the siegemaster `flowTypes` 1:1 with
 * `flowTypeContract`'s options; the colocated test's full-value assertion is what pins that.
 *
 * Inclusion LISTS rather than a `Record<kind, {flowrider: boolean, siegemaster: boolean}>` matrix:
 * under `as const` a matrix types `byUnitKind.terminal.flowrider` as the literal `true`, which
 * `@typescript-eslint/no-unnecessary-condition` reports as an always-truthy condition at the call
 * site. Lists read into a `Set` sidestep that and read as what they are.
 */

export const signoffTrackEligibilityStatics = {
  byTrack: {
    flowrider: {
      flowTypes: ['runtime'],
      unitKinds: ['terminal', 'branch', 'observable'],
      observableOrigins: ['spec', 'chaoswhisperer', 'codeweaver', 'flowrider', 'operator'],
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
    },
  },
} as const;
