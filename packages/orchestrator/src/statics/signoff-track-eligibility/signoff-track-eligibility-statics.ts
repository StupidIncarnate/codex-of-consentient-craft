/**
 * PURPOSE: What each verification track's denominator INCLUDES — the flow types it measures, the
 * unit kinds it owns, the package kinds it can reach, how an item's own declared packages narrow it
 * further, and the observable provenances it could ever have signed
 *
 * USAGE:
 * signoffTrackEligibilityStatics.byTrack.flowrider.unitKinds;
 * // Returns the unit kinds counted against Flowrider — off-map is absent
 * signoffTrackEligibilityStatics.byTrack.flowrider.observableOrigins;
 * // Returns the origins Flowrider could have signed — `siegemaster` is absent
 * signoffTrackEligibilityStatics.byTrack.flowrider.flowTypes;
 * // Returns the flow types Flowrider is measured over — `operational` is absent
 * signoffTrackEligibilityStatics.byTrack.groundstomper.packageTypes;
 * // Returns the package kinds a browser can walk — Groundstomper is measured over those alone
 * signoffTrackEligibilityStatics.byTrack.flowrider.packageScope;
 * // Returns how a Flowrider item's own `packageNames` slice its denominator — `partition`
 *
 * `byTrack` is keyed by the ROLE whose denominator each entry defines — the list
 * `signoffTracksStatics.denominators` names and `signoffDenominatorTrackContract` validates, which
 * is NOT the same list as the sign-off FIELDS. There are two fields — `flowriderSignoff` and
 * `siegemasterSignoff`, named by `signoffTracksStatics.fields`, validated by `signoffTrackContract`
 * and rendered by `textDisplaySymbolsStatics.signoffTrackMarks` — and three denominators over them:
 * Flowrider and Groundstomper both write `flowriderSignoff`, over disjoint `packageTypes`. Anything
 * needing "the two sign-off fields" reads that list, never these keys.
 *
 * `signoffField` IS THAT MANY-TO-ONE MAP, carried here rather than re-derived per consumer. Indexing
 * it makes a new `byTrack` key a COMPILE error at every measuring site, whereas the two-way ternary
 * it replaces silently routed every unnamed track to the field it does not write.
 *
 * FIVE SEPARATE EXCLUSIONS live here as DATA so the completion gate carries no role branches of
 * its own.
 *
 * 0. FLOW TYPE. An operational flow is a one-time task sequence whose end state is hand-checked;
 *    there is nothing repeatable for a flow-perspective suite to assert, so Flowrider is measured
 *    over `runtime` flows alone, and Groundstomper inherits that exclusion. Siegemaster verifies
 *    both, which is why it carries the full list rather than an absent field: "measures every type"
 *    is a statement, not a default.
 *
 * 1. UNIT KIND. The off-map probe families are Siegemaster's charter: they are the breakage classes
 *    a flow graph structurally cannot draw, probed by hand against a running system, which is not
 *    what a Flowrider or Groundstomper test suite is for. Counting them against either would report
 *    a hole no session of that role could ever close.
 *
 * 2. PACKAGE KIND. A unit routes by the packages its owning NODE is tagged with. Groundstomper
 *    drives a browser, so it can only prove a unit landing in a package a browser can reach —
 *    `frontend-react` and `frontend-ink`. Flowrider owns everything else. The two lists are
 *    DISJOINT and their union is Siegemaster's, which is what stops one unit being counted against
 *    both authoring roles and stops a unit falling between them. Naming the KINDS rather than the
 *    packages is what lets this run in a repo with several UI packages, or none.
 *
 * 3. PACKAGE SLICE. Rule 2 narrows by KIND, which is a property of the track. This one narrows by
 *    the NAMES an individual operation item declares, which is a property of how that track's items
 *    were sliced at Start, and the two tracks slice differently:
 *
 *    - `partition` — Flowrider's items ARE the package dimension: one item per package tagged alone
 *      on a runtime node, plus ONE seam item for the glue. So an item is measured over the units
 *      whose owning node tags exactly its one package, and the seam item over the units whose node
 *      tags two or more. Every unit lands in exactly one item, which is what makes a per-item pt
 *      budget mean something; an at-least-one reading would double-own every glue unit and leave the
 *      seam item — the honest replacement for the whole-quest reconcile — owning nothing distinct.
 *    - `intersection` — Groundstomper's items are one per e2e-eligible runtime FLOW, and their
 *      `packageNames` are the browser-reachable packages that flow touches, not a slice of the
 *      package dimension. An item is measured over every unit whose node tags any of them, glue
 *      nodes included: there is no groundstomper seam item to catch a glue unit that a partition
 *      reading would drop, and a two-UI-package glue node is outside Flowrider's `packageTypes`
 *      as well, so dropping it here would leave it owned by nobody. Siegemaster declares no package
 *      names at all, so the value never binds — stated rather than omitted, because "this track
 *      does not partition" is a claim, not a default.
 *
 * 4. PROVENANCE. A role that runs strictly AFTER a track cannot produce work that track was able to
 *    sign. The relay order is derived from `questTypeRegistryStatics.feature`: the intake role is
 *    `chaoswhisperer`, which also authors the `codeweaver` operation items at spec time
 *    (`startImplementationOps` is empty for a feature quest), and `relayTail` runs
 *    ward → flowrider → groundstomper → siegemaster → blightwarden → ward.
 *    `questBuildRelayGraphBroker` concatenates them as
 *    `[...settledExisting, ...implementationOps, ...tailOps]`, giving:
 *
 *        spec (present at approval) → chaoswhisperer → codeweaver → flowrider → groundstomper
 *        → siegemaster
 *
 *    So an observable with `addedBy: 'siegemaster'` is excluded from both authoring tracks and
 *    nothing else is. `operator` is out-of-band — a human writing an observable in at any point —
 *    and counts for every track, as does `spec`. `groundstomper` is deliberately absent from
 *    `observableOriginContract`: it extends the browser walk for units the graph already carries
 *    and holds no additive spec authority, so no observable can ever name it as an origin.
 *
 * `questTypeRegistryStatics['bug-hunt'].relayTail` carries none of the three operator roles, so no
 * track's gate ever binds on a bug-hunt quest.
 *
 * This is DATA only (statics may import statics, never contracts). `unitKinds` stays 1:1 with
 * `qaChecklistKindContract`'s options, the siegemaster `observableOrigins` 1:1 with
 * `observableOriginContract`'s options, the siegemaster `flowTypes` 1:1 with `flowTypeContract`'s
 * options, and the siegemaster `packageTypes` 1:1 with `packageTypeContract`'s options; the
 * colocated test's full-value assertion is what pins that.
 *
 * Inclusion LISTS rather than a `Record<kind, {flowrider: boolean, siegemaster: boolean}>` matrix:
 * under `as const` a matrix types `byUnitKind.terminal.flowrider` as the literal `true`, which
 * `@typescript-eslint/no-unnecessary-condition` reports as an always-truthy condition at the call
 * site. Lists read into a `Set` sidestep that and read as what they are.
 */

export const signoffTrackEligibilityStatics = {
  byTrack: {
    flowrider: {
      signoffField: 'flowriderSignoff',
      flowTypes: ['runtime'],
      unitKinds: ['terminal', 'branch', 'observable'],
      packageTypes: [
        'http-backend',
        'mcp-server',
        'hook-handlers',
        'eslint-plugin',
        'cli-tool',
        'programmatic-service',
        'library',
      ],
      packageScope: 'partition',
      observableOrigins: ['spec', 'chaoswhisperer', 'codeweaver', 'flowrider', 'operator'],
    },
    groundstomper: {
      signoffField: 'flowriderSignoff',
      flowTypes: ['runtime'],
      unitKinds: ['terminal', 'branch', 'observable'],
      packageTypes: ['frontend-react', 'frontend-ink'],
      packageScope: 'intersection',
      observableOrigins: ['spec', 'chaoswhisperer', 'codeweaver', 'flowrider', 'operator'],
    },
    siegemaster: {
      signoffField: 'siegemasterSignoff',
      flowTypes: ['runtime', 'operational'],
      unitKinds: ['terminal', 'branch', 'observable', 'off-map'],
      packageTypes: [
        'http-backend',
        'mcp-server',
        'frontend-react',
        'frontend-ink',
        'hook-handlers',
        'eslint-plugin',
        'cli-tool',
        'programmatic-service',
        'library',
      ],
      packageScope: 'intersection',
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
