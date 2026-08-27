/**
 * PURPOSE: What each verification track's denominator INCLUDES — the flow types it measures, the
 * unit kinds it owns, the package kinds it can reach, how an item's own declared flows and packages
 * narrow it further, and the observable provenances it could ever have signed
 *
 * USAGE:
 * signoffTrackEligibilityStatics.byTrack.flowrider.unitKinds;
 * // Returns the unit kinds counted against Flowrider — off-map is absent
 * signoffTrackEligibilityStatics.byTrack.flowrider.observableOrigins;
 * // Returns the origins Flowrider could have signed — `siegemaster` is absent
 * signoffTrackEligibilityStatics.byTrack.flowrider.flowTypes;
 * // Returns the flow types Flowrider is measured over — `operational` is absent
 * signoffTrackEligibilityStatics.byTrack.groundstomper.flowScope;
 * // Returns whether a Groundstomper item's own `flowIds` are its scope — `declared`
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
 * SIX SEPARATE EXCLUSIONS live here as DATA so the completion gate carries no role branches of
 * its own.
 *
 * 0. FLOW TYPE. An operational flow is a one-time task sequence whose end state is hand-checked;
 *    there is nothing repeatable for a flow-perspective suite to assert, so Flowrider is measured
 *    over `runtime` flows alone, and Groundstomper inherits that exclusion. Siegemaster verifies
 *    both, which is why it carries the full list rather than an absent field: "measures every type"
 *    is a statement, not a default.
 *
 * 1. FLOW SLICE. Rule 0 narrows by TYPE, which is a property of the track. This one says whether an
 *    individual operation item's own `flowIds` narrow it further, which is a property of the
 *    DIMENSION the relay sliced that track's items on (`questTypeRegistryStatics.feature.relayTail`
 *    `fanOutBy`), and the tracks slice differently:
 *
 *    - `declared` — Groundstomper (`fanOutBy: 'e2e-flow'`) and Siegemaster (`fanOutBy: 'flow'`) get
 *      ONE item per flow, each carrying that flow alone, so the item's `flowIds` ARE its coverage
 *      scope and the gate measures exactly the flow
 *      `get-qa-checklist({ questId, operationItemId })` answers for — that ONE id carries the track,
 *      the flows and the packages, and it REPLACED `track` and `packageNames` as separate arguments.
 *      Measuring such an item over every flow of an eligible type instead makes the first of
 *      several sibling items unable to signal `done` at all — every sibling flow sharing one of its
 *      packages lands in its denominator — which is the spent-pt-chain failure the slicing exists
 *      to remove. An item declaring NO flows matches nothing and is not gated, which is what keeps
 *      a flow-less quest and any pre-gate item completable.
 *    - `every-eligible` — Flowrider (`fanOutBy: 'package'`) is sliced on the PACKAGE dimension, so
 *      an item's flow list is a by-product of where its package happens to land rather than a slice
 *      of the flow dimension, and the whole-quest fallback item legitimately carries none. Reading
 *      `flowIds` there would leave that item ungated; the narrowing that means something for it is
 *      rule 4.
 *
 * 2. UNIT KIND. The off-map probe families are Siegemaster's charter: they are the breakage classes
 *    a flow graph structurally cannot draw, probed by hand against a running system, which is not
 *    what a Flowrider or Groundstomper test suite is for. Counting them against either would report
 *    a hole no session of that role could ever close.
 *
 * 3. PACKAGE KIND. A unit routes by the packages its owning NODE is tagged with. Groundstomper
 *    drives a browser, so it can only prove a unit landing in a package a browser can reach —
 *    `frontend-react` and `frontend-ink`. Flowrider owns everything else. The two lists are
 *    DISJOINT and their union is Siegemaster's, which is what stops one unit being counted against
 *    both authoring roles and stops a unit falling between them. Naming the KINDS rather than the
 *    packages is what lets this run in a repo with several UI packages, or none.
 *
 * 4. PACKAGE SLICE. Rule 3 narrows by KIND, which is a property of the track. This one narrows by
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
 * 5. PROVENANCE. A role that runs strictly AFTER a track cannot produce work that track was able to
 *    sign. The relay order is derived from `questTypeRegistryStatics.feature`: the intake role is
 *    `chaoswhisperer`, and `startImplementationOps` seeds ONE `codeweaver` item carrying
 *    `fanOutBy: 'implementation'` — the derived per-PACKAGE ledger `relayTailFanOutTransformer`
 *    expands at Start, not a plan ChaosWhisperer authors. `relayTail` runs
 *    ward → flowrider → groundstomper → siegemaster → ward; the five standards concerns are reviewed
 *    by a reviewer-minion INSIDE each committing session's own turn rather than by a relay role, so
 *    no standards review appears in this registry-derived order at all.
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
      flowScope: 'every-eligible',
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
      flowScope: 'declared',
      unitKinds: ['terminal', 'branch', 'observable'],
      packageTypes: ['frontend-react', 'frontend-ink'],
      packageScope: 'intersection',
      observableOrigins: ['spec', 'chaoswhisperer', 'codeweaver', 'flowrider', 'operator'],
    },
    siegemaster: {
      signoffField: 'siegemasterSignoff',
      flowTypes: ['runtime', 'operational'],
      flowScope: 'declared',
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
