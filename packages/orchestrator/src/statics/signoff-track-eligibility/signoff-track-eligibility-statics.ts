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
 * signoffTrackEligibilityStatics.byTrack.flowrider.flowScope;
 * // Returns whether a Flowrider item's own `flowIds` are its scope — `declared`
 * signoffTrackEligibilityStatics.byTrack.flowrider.packageScope;
 * // Returns how a Flowrider item's own `packageNames` narrow its denominator — `intersection`
 *
 * `byTrack` is keyed by the ROLE whose denominator each entry defines — the list
 * `signoffTracksStatics.denominators` names and `signoffDenominatorTrackContract` validates, which
 * is NOT the same list as the sign-off FIELDS. The fields — `codeweaverSignoff`,
 * `flowriderSignoff` and `siegemasterSignoff` — are named by `signoffTracksStatics.fields`,
 * validated by `signoffTrackContract` and rendered by `textDisplaySymbolsStatics.signoffTrackMarks`.
 * Anything needing "the sign-off fields" reads that list, never these keys.
 *
 * `signoffField` IS THE MANY-TO-ONE MAP between the two, carried here rather than re-derived per
 * consumer. Indexing it makes a new `byTrack` key a COMPILE error at every measuring site, whereas
 * a ternary silently routes every unnamed track to a field it does not write.
 *
 * SIX SEPARATE EXCLUSIONS live here as DATA so no consumer of a denominator carries role branches
 * of its own.
 *
 * 0. FLOW TYPE. An operational flow is a one-time task sequence whose end state is hand-checked;
 *    there is nothing repeatable for a flow-perspective suite to assert, so Flowrider is measured
 *    over `runtime` flows alone. Siegemaster verifies both, which is why it carries the full list
 *    rather than an absent field: "measures every type" is a statement, not a default. Codeweaver
 *    carries the full list for a different reason: it BUILDS both types, and an operational flow's
 *    code is unit-testable exactly as a runtime flow's is — what an operational flow lacks is a
 *    repeatable end-to-end walk, not assertable units.
 *
 * 1. FLOW SLICE. Rule 0 narrows by TYPE, which is a property of the track. This one says whether an
 *    individual operation item's own `flowIds` narrow it further, and EVERY track reads `declared`
 *    because every track's items are sliced on the flow dimension: Flowrider and Siegemaster get
 *    one item per flow (`fanOutBy: 'flow'`), and Codeweaver
 *    (`fanOutBy: 'implementation'`, on `startImplementationOps` rather than `relayTail`) gets one
 *    item per (PACKAGE, FLOW) cell — one package's half of one flow — plus a single flow-less item
 *    for a package that owns contracts and tags no node anywhere. The item's `flowIds` ARE its
 *    coverage scope, and it is exactly the flows
 *    `get-qa-checklist({ questId, operationItemId })` answers for — that ONE id carries the track,
 *    the flows and the packages, and it REPLACED `track` and `packageNames` as separate arguments.
 *    Scoping such an item over every flow of an eligible type instead hands the first of several
 *    sibling items a work list several sessions were meant to split between them. An item declaring
 *    NO flows matches nothing, which is what keeps a flow-less quest and any track-less item
 *    completable.
 *
 * 2. UNIT KIND. The off-map probe families are Siegemaster's charter: they are the breakage classes
 *    a flow graph structurally cannot draw, probed by hand against a running system, which is not
 *    what a Codeweaver or Flowrider test suite is for. Counting them against either would report a
 *    hole no session of that role could ever close.
 *
 * 3. PACKAGE KIND. A unit routes by the packages its owning NODE is tagged with, and all three
 *    tracks carry the SAME full list: each one is measured over every package kind the quest can
 *    touch. Naming the KINDS rather than the packages is what lets this run in a repo with several
 *    UI packages, or none. The three lists overlapping is not double-counting — a different KIND of
 *    proof over the same unit is exactly what a separate column is for.
 *
 * 4. PACKAGE SLICE. Rule 3 narrows by KIND, which is a property of the track. This one narrows by
 *    the NAMES an individual operation item declares, and every track reads `intersection`: an item
 *    is measured over every unit whose owning node tags any of its names, GLUE NODES INCLUDED. No
 *    track mints a separate seam item, so a glue unit dropped here would be owned by nobody.
 *    Siegemaster declares no package names at all, so the value never binds — stated rather than
 *    omitted, because "this track does not partition" is a claim, not a default.
 *
 * 5. PROVENANCE. A role that runs strictly AFTER a track cannot produce work that track was able to
 *    sign. The relay order is derived from `questTypeRegistryStatics.feature`: the intake role is
 *    `chaoswhisperer`, and `startImplementationOps` seeds ONE `codeweaver` item carrying
 *    `fanOutBy: 'implementation'` — the derived per-CELL ledger `relayTailFanOutTransformer`
 *    expands at Start, not a plan ChaosWhisperer authors. `relayTail` runs
 *    ward → flowrider → siegemaster → ward; the five standards concerns are reviewed by a reviewer
 *    INSIDE each committing session's own turn rather than by a relay role, so no standards review
 *    appears in this registry-derived order at all. `questBuildRelayGraphBroker` concatenates them
 *    as `[...settledExisting, ...implementationOps, ...tailOps]`, giving:
 *
 *        spec (present at approval) → chaoswhisperer → codeweaver → flowrider → siegemaster
 *
 *    So an observable with `addedBy: 'siegemaster'` is excluded from Codeweaver and Flowrider
 *    alike, and nothing else is. `operator` is out-of-band — a human writing an observable in at
 *    any point — and counts for every track, as does `spec`. Codeweaver's list is Flowrider's
 *    rather than a shorter one: a `flowrider` origin reaches a codeweaver session on a LATER `pt N`
 *    continuation of that package, and dropping it would park such an observable outside every
 *    codeweaver denominator permanently.
 *
 * 6. VERIFICATION METHOD. An observable carrying `verifyByReading` is settled by opening a source
 *    file — the import is there, the literal is not inlined. Codeweaver's reviewer opens every file
 *    the pass produced and is the one session on the relay already doing that, so Codeweaver alone
 *    carries `reading`. Flowrider writes suites and Siegemaster drives a running system; neither can
 *    settle where a value came from, and counting such a unit against them parks a permanent hole in
 *    the one surface a human reads to find work that still needs a look. A unit's method is
 *    `reading` when the flag is set and `test` when it is absent — the flag is optional on the
 *    observable so that an absent field costs nothing on disk, and this list is where the absent
 *    case gets its name.
 *
 * BOTH QUEST TYPES RUN THIS RELAY. `questTypeRegistryStatics['bug-hunt']` seeds the same
 * `codeweaver` implementation item and the same flowrider/siegemaster tail, so every rule here
 * binds on a bug-hunt quest exactly as it does on a feature one.
 *
 * This is DATA only (statics may import statics, never contracts). `unitKinds` stays 1:1 with
 * `qaChecklistKindContract`'s options, the siegemaster `observableOrigins` 1:1 with
 * `observableOriginContract`'s options, the siegemaster `flowTypes` 1:1 with `flowTypeContract`'s
 * options, and the siegemaster `packageTypes` 1:1 with `packageTypeContract`'s options; the
 * colocated test's full-value assertion is what pins that.
 *
 * Inclusion LISTS rather than a `Record<kind, Record<track, boolean>>` matrix:
 * under `as const` a matrix types `byUnitKind.terminal.flowrider` as the literal `true`, which
 * `@typescript-eslint/no-unnecessary-condition` reports as an always-truthy condition at the call
 * site. Lists read into a `Set` sidestep that and read as what they are.
 */

export const signoffTrackEligibilityStatics = {
  byTrack: {
    codeweaver: {
      signoffField: 'codeweaverSignoff',
      flowTypes: ['runtime', 'operational'],
      flowScope: 'declared',
      unitKinds: ['terminal', 'branch', 'observable'],
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
      observableOrigins: ['spec', 'chaoswhisperer', 'codeweaver', 'flowrider', 'operator'],
      verificationMethods: ['test', 'reading'],
    },
    flowrider: {
      signoffField: 'flowriderSignoff',
      flowTypes: ['runtime'],
      flowScope: 'declared',
      unitKinds: ['terminal', 'branch', 'observable'],
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
      observableOrigins: ['spec', 'chaoswhisperer', 'codeweaver', 'flowrider', 'operator'],
      verificationMethods: ['test'],
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
      verificationMethods: ['test'],
    },
  },
} as const;
