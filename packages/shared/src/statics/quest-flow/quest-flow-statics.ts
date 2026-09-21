/**
 * PURPOSE: The family graph each quest type runs — which operator family the relay enters at, and
 * which family every OUTCOME of a family routes to. Reach for this when the question is what runs
 * after what; the scope a routed family mints is built from the `role` and `text` carried here.
 *
 * USAGE:
 * questFlowStatics.feature.families.codeweaver.routes.done;
 * // Returns 'flowrider' — the family the relay moves to once every codeweaver scope is complete.
 *
 * This is DATA only (statics may import statics, never brokers). `entry` names the family the relay
 * starts at; a route target is either another family key in the same object, `@complete`, or
 * `@blocked`.
 *
 * THE TWO TYPES SHARE ONE GRAPH. A bug-hunt's intake writes flows and observables exactly as a
 * feature's does, so the same operators verify them; what differs is the intake — its slash command
 * and its `initialWorkItemRole` — and nothing after it.
 *
 * The grammar can express a back-edge, and a `siegemaster` route back to `codeweaver` would be an
 * edit here rather than a code change. Nothing declares one: a scope only ever ends `@done` or
 * `@blocked`, so no family produces an outcome a back-edge fires on. The graph is acyclic and needs
 * no family-level `maxVisits`.
 *
 * A family's `done` fires once EVERY one of its fanned-out scopes is complete — codeweaver with nine
 * cells routes to flowrider ONCE, on the ninth. `empty` is the same edge for a family that fanned
 * out to nothing: flowrider covers RUNTIME flows alone, so a quest with none routes straight on
 * instead of stalling. Declaring it as a route makes that a decision rather than an accident.
 *
 * `fanOutBy` is how ONE family becomes N scopes: `implementation` is one per (PACKAGE, FLOW) CELL,
 * `flow` is one per quest flow. A family that OMITS the field mints exactly one scope, which is why
 * it is absent rather than carrying a "none" member — it is read with an `in` check, as `locked` is,
 * and `locked` defaults TRUE. Codeweaver sets it false on purpose: `locked` enrols a scope in its
 * role's pt budget, and a codeweaver chain has to stay unbounded because the flows are the
 * acceptance target and the work has to land.
 *
 * `operationItemContract` requires both `role` and `text`, so every family carries both — except
 * `warpgate`. A merge is appended to the ledger at the user's request rather than routed to, which
 * is what `appendedAtMerge` and the absence of any inbound route say; its text lives in the
 * orchestrator's own `warpgateOperationStatics`, and `role` rides along for a reader that wants
 * every family's role uniformly.
 *
 * `wardFull` is the only family whose `role` is `ward`, so nothing here needs a second field to tell
 * two ward families apart.
 *
 * Role strings are cross-checked against workItemRoleStatics in the colocated test so they cannot
 * drift.
 */

export const questFlowStatics = {
  feature: {
    intakeSlashCommandFileName: 'dumpster-create.md',
    initialWorkItemRole: 'chaoswhisperer',
    entry: 'riftcarver',
    families: {
      riftcarver: {
        role: 'riftcarver',
        text: 'Riftcarver: carve the quest branch, worktree and preflight typecheck',
        routes: { done: 'codeweaver', wall: '@blocked' },
      },
      codeweaver: {
        role: 'codeweaver',
        text: 'Codeweaver: build this slice',
        fanOutBy: 'implementation',
        locked: false,
        routes: { done: 'flowrider', empty: 'flowrider', wall: '@blocked' },
      },
      flowrider: {
        role: 'flowrider',
        text: 'Flowrider: author the test suites that prove this flow',
        fanOutBy: 'flow',
        routes: { done: 'siegemaster', empty: 'siegemaster', wall: '@blocked' },
      },
      siegemaster: {
        role: 'siegemaster',
        text: 'Siegemaster: manual-QA this flow and review its test suite',
        fanOutBy: 'flow',
        routes: { done: 'wardFull', empty: 'wardFull', wall: '@blocked' },
      },
      wardFull: {
        role: 'ward',
        text: 'Ward gate (full monorepo)',
        routes: { done: '@complete', wall: '@blocked' },
      },
      warpgate: {
        role: 'warpgate',
        appendedAtMerge: true,
        routes: { done: '@complete', wall: '@blocked' },
      },
    },
  },
  'bug-hunt': {
    intakeSlashCommandFileName: 'dumpster-hunt.md',
    initialWorkItemRole: 'bughunt',
    entry: 'riftcarver',
    families: {
      riftcarver: {
        role: 'riftcarver',
        text: 'Riftcarver: carve the quest branch, worktree and preflight typecheck',
        routes: { done: 'codeweaver', wall: '@blocked' },
      },
      codeweaver: {
        role: 'codeweaver',
        text: 'Codeweaver: build this slice',
        fanOutBy: 'implementation',
        locked: false,
        routes: { done: 'flowrider', empty: 'flowrider', wall: '@blocked' },
      },
      flowrider: {
        role: 'flowrider',
        text: 'Flowrider: author the test suites that prove this flow',
        fanOutBy: 'flow',
        routes: { done: 'siegemaster', empty: 'siegemaster', wall: '@blocked' },
      },
      siegemaster: {
        role: 'siegemaster',
        text: 'Siegemaster: manual-QA this flow and review its test suite',
        fanOutBy: 'flow',
        routes: { done: 'wardFull', empty: 'wardFull', wall: '@blocked' },
      },
      wardFull: {
        role: 'ward',
        text: 'Ward gate (full monorepo)',
        routes: { done: '@complete', wall: '@blocked' },
      },
      warpgate: {
        role: 'warpgate',
        appendedAtMerge: true,
        routes: { done: '@complete', wall: '@blocked' },
      },
    },
  },
} as const;
