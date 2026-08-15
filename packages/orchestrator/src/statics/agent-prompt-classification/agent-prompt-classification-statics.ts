/**
 * PURPOSE: Classifies agent prompt names by dispatch surface — `minion` names are dispatched
 * by parent agents (ChaosWhisperer, Codeweaver, Flowrider, or Siegemaster) via the Agent tool and
 * receive a minimal "Quest ID + Work Item ID" $ARGUMENTS substitution; `role` names map to
 * AgentRole operation-relay sessions dispatched by the orchestrator.
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
 * `roleNames` and `minionNames` are now DISJOINT, and the invariant is worth stating because it did
 * not always hold: `blightwarden-group-minion` and `blightwarden-crosscut-minion` used to appear in
 * both, since the blightwarden parent summoned them AND they were valid work-item roles. That whole
 * family is gone — `blightscout` reviews one commit alone and summons nothing — so a name is now
 * either a role the orchestrator dispatches against an operation item, or a minion a parent briefs
 * inline, never both. A minion added to `roleNames` would widen `agentRoleContract` with a role no
 * operation item can ever hold; a role added to `minionNames` would let it fetch its prompt without
 * a workItemId and escape `subagentStopNeedsBlockGuard`.
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
    'blightscout',
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
    /** Blightscout — the standards review of ONE commit, appended after every role that commits
     * rather than run once over the whole diff at the end. It summons nothing: the surface is a
     * single session's output, so there is no partition to fan out and no artifact to verify. Five
     * concerns (craft, perf, dedup, integrity, test-cases), fixed in place, dispositioned per unit
     * into `planningNotes.blightLedger`. */
    'blightscout',
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
  ],
} as const;
