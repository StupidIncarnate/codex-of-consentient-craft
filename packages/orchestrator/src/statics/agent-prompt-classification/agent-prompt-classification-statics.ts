/**
 * PURPOSE: Classifies agent prompt names by dispatch surface — `minion` names are dispatched
 * by parent agents (ChaosWhisperer, Codeweaver, Blightwarden, Flowrider, or Siegemaster) via the Agent
 * tool and receive a minimal
 * "Quest ID + Work Item ID" $ARGUMENTS substitution; `role` names map to AgentRole operation-relay
 * sessions dispatched by the orchestrator.
 *
 * USAGE:
 * agentPromptClassificationStatics.minionNames.includes(name);
 * // Returns true if the agent prompt name is a parent-dispatched minion.
 *
 * `promptNames` and `roleNames` are the source `agentPromptNameContract` and `agentRoleContract`
 * build their enums from, so the three lists cannot drift. A test that must cover every served
 * prompt reads them from here — test files may not import contracts, and a hand-copied list goes
 * quietly stale the moment a prompt is added.
 *
 * The lists OVERLAP by design, and narrowly: `blightwarden-group-minion` and
 * `blightwarden-crosscut-minion` appear in BOTH `minionNames` and `roleNames`. They are summoned by
 * the blightwarden parent like any
 * other minion, yet they are also valid work-item roles — so `minionNames` is "may fetch without a
 * workItemId", not "is not a role".
 *
 * A minion that carries no work item belongs in `minionNames` ONLY —
 * `flowrider-coverage-minion`, `siegemaster-test-audit-minion` and `blightwarden-deadcode-minion`
 * are all parent-summoned with nothing on the operations ledger to link to. Adding any of them to
 * `roleNames` would widen `agentRoleContract` with a role no operation item can ever hold.
 */

export const agentPromptClassificationStatics = {
  promptNames: [
    'chaoswhisperer-gap-minion',
    'codeweaver',
    'codeweaver-piece-minion',
    'spiritmender',
    'flowrider',
    'flowrider-authoring-minion',
    'flowrider-coverage-minion',
    'groundstomper',
    'siegemaster',
    'siegemaster-walker-minion',
    'siegemaster-test-audit-minion',
    'blightwarden',
    'blightwarden-group-minion',
    'blightwarden-crosscut-minion',
    'blightwarden-deadcode-minion',
    'pesteater',
    'warpgate',
  ],
  roleNames: [
    'codeweaver',
    'spiritmender',
    /** Flowrider — operator that authors the flow-perspective test suites BELOW the browser
     * (integration and unit; Playwright is Groundstomper's) for ALL
     * quest flows in one session, delegating each bundle to a `flowrider-authoring-minion` and
     * verifying the result by reopening the files. Tests are its primary output; it and its minions
     * also close the implementation holes their testing exposes, red-first, handing on only the
     * architectural ones. */
    'flowrider',
    /** Groundstomper — operator that owns the Playwright walk for ONE runtime flow, in one session
     * with no minions. It resolves the e2e-eligible packages from the quest's `packagesAffected`,
     * inventories their existing `.e2e.ts` files, and extends the suite that already covers its
     * flow's entry route rather than standing a parallel one beside it. */
    'groundstomper',
    /** Siegemaster — operator that manual-QAs ALL quest flows in one session via
     * `siegemaster-walker-minion` walkers against one shared dev server, then TDD-fixes what they
     * find. Widest fix authority on the quest: nothing after it runs the system. */
    'siegemaster',
    /** Blightwarden minions — `blightwarden-group-minion` reviews and fixes ONE tight group of file
     * pairs against the four blight concerns (craft, perf, dedup, integrity);
     * `blightwarden-crosscut-minion` runs alone over the whole diff, catching duplication across
     * pairs and whole-diff blast radius. Both summoned by the blightwarden parent via the Agent tool
     * (no work item of their own). `blightwarden-deadcode-minion` is the third wave and is
     * deliberately absent from this list — it is a minion only, never a work-item role. */
    'blightwarden-group-minion',
    'blightwarden-crosscut-minion',
    /** Blightwarden synthesizer — runs after its minions, judges their fixes, cleans up. */
    'blightwarden',
    'pesteater',
    /** Warpgate — merge relay worker, dispatched from the ledger like any other role; lands the
     * quest branch on the base branch. `tavernkeeper` is deliberately absent from this list (and
     * from `promptNames`/`minionNames`) — chat roles are served by the chat prompt path, not by
     * `get-agent-prompt`. */
    'warpgate',
  ],
  minionNames: [
    'chaoswhisperer-gap-minion',
    'codeweaver-piece-minion',
    'flowrider-authoring-minion',
    'flowrider-coverage-minion',
    'siegemaster-walker-minion',
    'siegemaster-test-audit-minion',
    'blightwarden-group-minion',
    'blightwarden-crosscut-minion',
    'blightwarden-deadcode-minion',
  ],
} as const;
