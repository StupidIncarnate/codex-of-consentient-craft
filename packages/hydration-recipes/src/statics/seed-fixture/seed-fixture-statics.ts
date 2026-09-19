/**
 * PURPOSE: Every literal the two built recipes write — guild name and path segment, the three quest
 * titles, the flow blueprint that clears the gates, the status walk to `in_progress`, and the whole
 * session transcript's ids, texts and timestamps. Reach for this over inlining a value in a recipe
 * broker: "a recipe never calls `Date.now()`, `Math.random()` or `randomUUID()` for anything that
 * reaches a screen" (siegelense-recipes.md line 283), and the only way to hold that is for every
 * such value to be a literal somebody can read. Two runs of a recipe produce byte-identical state,
 * which is what makes `pixelChange` and the element delta mean something (Part 4, line 356).
 *
 * `quest.statusWalk` is the ordered edge list of `questStatusTransitionsStatics` from `created` to
 * `in_progress`, one PATCH per entry. `quest.flowsAtStatus` names the ONE transition that carries
 * the flow blueprint: `questStatusInputAllowlistStatics.explore_flows` is the first status whose
 * allowlist admits `flows`, and `questGateContentRequirementsStatics` needs them non-empty two
 * edges later.
 *
 * `session.packageName` is deliberately NOT a name from this repo — nothing in the app may
 * recognise a package by name, and a fixture built from real names would hide it if something did.
 *
 * USAGE:
 * seedFixtureStatics.quest.statusWalk;
 * // Returns the seven statuses a quest is PATCHed through to reach in_progress
 */

export const seedFixtureStatics = {
  guild: {
    name: 'Siege Guild',
    // Sits inside the lane's throwaway home, so `kill` takes it with everything else.
    pathSegment: 'siege-repo',
  },
  quest: {
    titles: [
      'Siege quest one — untouched',
      'Siege quest two — in progress',
      'Siege quest three — untouched',
    ],
    userRequest:
      'Seeded by the guild-with-three-quests recipe. Nothing here was written by an agent.',
    // The SECOND of the three is the one walked to in_progress: with three rows and the middle one
    // differing, "the right one" and "the first one" are different values, so an off-by-index bug
    // cannot pass (siegelense-recipes.md line 454).
    inProgressIndex: 1,
    statusWalk: [
      'explore_flows',
      'review_flows',
      'flows_approved',
      'explore_observables',
      'review_observables',
      'approved',
      'in_progress',
    ],
    flowsAtStatus: 'review_flows',
    packageName: 'siege-fixture-service',
    // `changeType: 'new'` with a `usedBy` list, not `'edit'`. The app VALIDATES this against the
    // filesystem (`questPackageEntryViolationsTransformer`): an `edit` entry must resolve on disk,
    // and the seeded guild points at an empty directory inside the throwaway home, so nothing does.
    // A `new` entry is the honest declaration for a package this quest would be what creates — and
    // it must name its consumers, because a package with no package.json yet has no reverse edges.
    packagesAffected: [
      {
        name: 'siege-fixture-service',
        location: './packages/siege-fixture-service',
        changeType: 'new',
        packageType: 'library',
        usedBy: ['siege-fixture-consumer'],
      },
    ],
    flows: [
      {
        id: 'siege-flow',
        name: 'Siege Flow',
        flowType: 'runtime',
        entryPoint: 'start',
        exitPoints: ['end'],
        nodes: [
          {
            id: 'start',
            label: 'Start',
            type: 'state',
            packages: ['siege-fixture-service'],
            observables: [],
          },
          {
            id: 'end',
            label: 'End',
            type: 'terminal',
            packages: ['siege-fixture-service'],
            observables: [],
          },
        ],
        edges: [{ id: 'start-to-end', from: 'start', to: 'end' }],
      },
    ],
  },
  session: {
    sessionId: 'a1b2c3d4-0000-4000-8000-000000000001',
    outerAgentId: 'a1b2c3d4-0000-4000-8000-0000000000a1',
    nestedAgentId: 'a1b2c3d4-0000-4000-8000-0000000000b2',
    outerToolUseId: 'toolu_siege_outer_chain',
    nestedToolUseId: 'toolu_siege_nested_chain',
    userMessage: 'Seeded by the session-with-nested-subagent recipe.',
    outerDescription: 'Outer chain',
    nestedDescription: 'Nested chain',
    outerPrompt: 'Outer chain prompt',
    nestedPrompt: 'Nested chain prompt',
    outerText: 'OUTER CHAIN BODY — written before the nested chain was launched.',
    nestedText: 'NESTED CHAIN BODY — this chain sits inside the outer one.',
    completionText: 'done',
    // A fixed base and fixed offsets, never a clock. The replay broker sorts every line across the
    // main and both sub-agent files into one timestamp-ordered stream, so Task(outer) must sort
    // before Task(nested), which must sort before the nested body — chain outer has to exist before
    // chain nested reparents under it.
    baseTimestamp: '2026-01-01T00:00:00.000Z',
    offsetSeconds: {
      userMessage: 0,
      outerLaunch: 1,
      outerText: 2,
      nestedLaunch: 3,
      nestedText: 4,
      nestedCompletion: 5,
      outerCompletion: 10,
    },
    usage: { inputTokens: 60, outputTokens: 20 },
  },
} as const;
