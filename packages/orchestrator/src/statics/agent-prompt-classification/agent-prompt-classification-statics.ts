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
 * The lists OVERLAP by design: `blightwarden-minion` and `blightwarden-crosscut-minion` appear in
 * BOTH `minionNames` and `roleNames`. They are summoned by the blightwarden parent like any other
 * minion, yet they are also valid work-item roles — so `minionNames` is "may fetch without a
 * workItemId", not "is not a role".
 */

export const agentPromptClassificationStatics = {
  promptNames: [
    'chaoswhisperer-gap-minion',
    'codeweaver',
    'codeweaver-minion',
    'spiritmender',
    'flowrider',
    'flowrider-minion',
    'siegemaster',
    'siegemaster-minion',
    'siegemaster-test-audit-minion',
    'blightwarden',
    'blightwarden-minion',
    'blightwarden-crosscut-minion',
    'pesteater',
  ],
  roleNames: [
    'codeweaver',
    'spiritmender',
    /** Flowrider — operator that authors the flow-perspective test suites (integration/e2e) for ALL
     * quest flows in one session, delegating each bundle to a `flowrider-minion` and verifying the
     * result by reopening the files. Tests are its primary output; it and its minions also close the
     * implementation holes their testing exposes, red-first, handing on only the architectural ones. */
    'flowrider',
    /** Siegemaster — operator that manual-QAs ALL quest flows in one session via `siegemaster-minion`
     * walkers against one shared dev server, then TDD-fixes what they find. Widest fix authority on the
     * quest: nothing after it runs the system. */
    'siegemaster',
    /** Blightwarden minions — `blightwarden-minion` reviews and fixes ONE tight group of file pairs
     * against all seven blight concerns; `blightwarden-crosscut-minion` runs alone and last, catching
     * duplication across pairs and whole-diff blast radius. Both summoned by the blightwarden parent
     * via the Agent tool (no work item of their own). */
    'blightwarden-minion',
    'blightwarden-crosscut-minion',
    /** Blightwarden synthesizer — runs after its minions, judges their fixes, cleans up. */
    'blightwarden',
    'pesteater',
  ],
  minionNames: [
    'chaoswhisperer-gap-minion',
    'codeweaver-minion',
    'flowrider-minion',
    'siegemaster-minion',
    'siegemaster-test-audit-minion',
    'blightwarden-minion',
    'blightwarden-crosscut-minion',
  ],
} as const;
