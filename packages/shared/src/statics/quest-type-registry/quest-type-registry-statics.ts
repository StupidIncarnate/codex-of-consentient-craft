/**
 * PURPOSE: Single source of truth mapping each quest type to the data that drives its complete
 * work-item flow — the intake slash command, the create-time seed role, the Start-Quest relay
 * seed (implementation operation items + the fixed verify tail), and the execution roles it uses.
 *
 * USAGE:
 * questTypeRegistryStatics['bug-hunt'].relayTail;
 * // Returns the verify-tail operation-item seeds questBuildRelayGraphBroker appends at Start.
 *
 * This is DATA only (statics may import statics, never brokers). `startImplementationOps` are the
 * implementation operation items the orchestrator seeds at Start, and BOTH quest types use it. Its
 * FIRST entry is `riftcarver` for either type: the branch, the worktree and the preflight build are
 * the head of the relay, so the workspace is forged when the quest is next in line rather than
 * inside the Start POST. After it BOTH types seed the same `codeweaver` item, which fans out into
 * one slice per (PACKAGE, FLOW) cell.
 * ChaosWhisperer authors no part of the ledger — `operations` is off its modify-quest allowlist, and
 * the partition is DERIVED from the flow nodes' package tags and the contracts' source paths
 * instead. `relayTail` is the fixed verify chain appended after the implementation items. Adding a
 * new quest type = one entry here + the type added to questTypeContract.
 *
 * THE TWO TYPES SHARE ONE RELAY. A bug-hunt's intake writes flows and observables exactly as a
 * feature's does, so the same three operators verify them; what differs is the intake — its slash
 * command and its `initialWorkItemRole` — and nothing after it.
 *
 * `fanOutBy` is how ONE seed becomes N operation items, expressed as data so the relay's expansion
 * reads a field instead of matching role names:
 *
 * - `flow` — one item per quest flow the SEED'S OWN ROLE is measured over, each carrying a single
 *   `flowId`. Which flow types those are is the verification track's own
 *   `signoffTrackEligibilityStatics.byTrack[role].flowTypes`, read there rather than restated here
 *   so the ledger and that track's own work list cannot disagree: siegemaster takes both types,
 *   flowrider `runtime` alone. With no eligible flow the role keeps one whole-quest item only when
 *   it owns the off-map probe families, which no drawn flow can carry.
 * - `implementation` — one item per (PACKAGE, FLOW) CELL, wherever a package tags a node on that
 *   flow, across BOTH flow types. A package owning contracts and tagging NO node anywhere still gets
 *   exactly one item, with an empty flow list; a package that does tag nodes gets cells alone, and
 *   its contracts reach it through the `packageName`-only `get-quest` call. Ordered by package KIND
 *   tier, then manifest depth, then name, with one package's cells in flow declaration order. This
 *   is the derived codeweaver ledger.
 *
 * An entry that OMITS the field seeds exactly one item, which is why it is absent rather than
 * carrying a "none" member: the shape mirrors `wardMode`, read at the seed site with an `in` check.
 * `locked` is read the same way and defaults TRUE. Codeweaver sets it false on purpose: `locked` is
 * what enrols an item in its role's `slotManagerStatics` pt budget, and a codeweaver chain must stay
 * unbounded because the flows are the acceptance target and the work has to land. Nothing can delete
 * an unlocked item any more either — `operations` is off the modify-quest allowlist entirely.
 *
 * Role and slash-command-filename strings are cross-checked against workItemRoleContract and
 * slashCommandsStatics in the colocated test so they cannot drift.
 */

export const questTypeRegistryStatics = {
  feature: {
    intakeSlashCommandFileName: 'dumpster-create.md',
    initialWorkItemRole: 'chaoswhisperer',
    startImplementationOps: [
      {
        role: 'riftcarver',
        // FIRST for both quest types: nothing else can run until the branch, worktree and preflight
        // build exist, and putting it here is what moves that minutes-long work off the Start POST
        // and onto the relay, where it happens when the quest is next in line. No `fanOutBy`, so it
        // seeds exactly one item; no `locked`, so it defaults TRUE and is enrolled in its
        // slotManagerStatics pt budget — a carve that cannot converge in a bounded number of
        // spiritmender passes is a halt worth surfacing rather than a loop.
        text: 'Riftcarver: carve the quest branch, worktree and preflight build',
      },
      {
        role: 'codeweaver',
        // Fanned out into one item per (PACKAGE, FLOW) cell — one package's half of one flow.
        // `locked: false` keeps the pt chain unbounded — see the `locked` note above.
        text: 'Codeweaver: build this slice',
        fanOutBy: 'implementation',
        locked: false,
      },
    ],
    relayTail: [
      { role: 'ward', text: 'Ward gate (changed files)', wardMode: 'changed' },
      {
        role: 'flowrider',
        // Fanned out to ONE item per RUNTIME flow. A flow is what a suite walks end to end, so it
        // is the unit; per-flow items mean per-flow pt budgets and a per-flow work list. The
        // runtime narrowing is not stated here — it is this role's own `flowTypes` in
        // signoffTrackEligibilityStatics, which the fan-out reads.
        text: 'Flowrider: author the test suites that prove this flow',
        fanOutBy: 'flow',
      },
      {
        role: 'siegemaster',
        // Fanned out to ONE item per quest flow by questBuildRelayGraphBroker, which appends
        // "— flow: <id>"; its track measures both flow types, so no flow is dropped. Per-flow items
        // mean per-flow pt budgets and a per-flow work list: a whole-quest item put every
        // flow behind one budget of 3 and one session's context.
        text: 'Siegemaster: manual-QA this flow and review its test suite',
        fanOutBy: 'flow',
      },
      // No standards-review item: the five standards concerns are reviewed INSIDE each committing
      // session's own turn, by the reviewer its operator summons, rather than by a separate relay
      // role scheduled here.
      { role: 'ward', text: 'Ward gate (full monorepo)', wardMode: 'full' },
    ],
    roles: ['riftcarver', 'codeweaver', 'ward', 'flowrider', 'siegemaster', 'spiritmender'],
  },
  'bug-hunt': {
    intakeSlashCommandFileName: 'dumpster-hunt.md',
    initialWorkItemRole: 'bughunt',
    startImplementationOps: [
      {
        role: 'riftcarver',
        // Same head-of-relay seed as `feature`, and for the same reasons — see the note there.
        text: 'Riftcarver: carve the quest branch, worktree and preflight build',
      },
      {
        role: 'codeweaver',
        // The SAME seed `feature` carries. A bug-hunt intake produces flows and observables, so the
        // fan-out has the same input and the fix is built the same way — the reproducing test is
        // the first thing that package's session writes.
        text: 'Codeweaver: build this slice',
        fanOutBy: 'implementation',
        locked: false,
      },
    ],
    relayTail: [
      { role: 'ward', text: 'Ward gate (changed files)', wardMode: 'changed' },
      {
        role: 'flowrider',
        text: 'Flowrider: author the test suites that prove this flow',
        fanOutBy: 'flow',
      },
      {
        role: 'siegemaster',
        text: 'Siegemaster: manual-QA this flow and review its test suite',
        fanOutBy: 'flow',
      },
      { role: 'ward', text: 'Ward gate (full monorepo)', wardMode: 'full' },
    ],
    roles: ['riftcarver', 'codeweaver', 'ward', 'flowrider', 'siegemaster', 'spiritmender'],
  },
} as const;
