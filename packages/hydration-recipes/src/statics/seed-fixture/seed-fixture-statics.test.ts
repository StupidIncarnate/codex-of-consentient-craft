import { seedFixtureStatics } from './seed-fixture-statics';

describe('seedFixtureStatics', () => {
  describe('the guild-with-three-quests half', () => {
    it('VALID: quest.titles => exactly three distinct titles', () => {
      expect(seedFixtureStatics.quest.titles).toStrictEqual([
        'Siege quest one — untouched',
        'Siege quest two — in progress',
        'Siege quest three — untouched',
      ]);
    });

    it('VALID: quest.inProgressIndex => 1, the MIDDLE quest', () => {
      expect(seedFixtureStatics.quest.inProgressIndex).toBe(1);
    });

    it('VALID: quest.statusWalk => the seven edges from created to in_progress, ending at in_progress', () => {
      expect(seedFixtureStatics.quest.statusWalk).toStrictEqual([
        'explore_flows',
        'review_flows',
        'flows_approved',
        'explore_observables',
        'review_observables',
        'approved',
        'in_progress',
      ]);
    });

    it('VALID: quest.flowsAtStatus => review_flows, a status the walk visits', () => {
      expect(seedFixtureStatics.quest.flowsAtStatus).toBe('review_flows');
    });

    it('VALID: every flow node tags a package the quest declares', () => {
      const declared = seedFixtureStatics.quest.packagesAffected.map((entry) => entry.name);
      const untagged = seedFixtureStatics.quest.flows.flatMap((flow) =>
        flow.nodes.flatMap((node) => node.packages.filter((name) => !declared.includes(name))),
      );

      expect(untagged).toStrictEqual([]);
    });
  });

  describe('the session-with-nested-subagent half', () => {
    it('VALID: session ids => the outer and nested agents are different values', () => {
      expect(seedFixtureStatics.session).toStrictEqual({
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
      });
    });
  });

  describe('determinism', () => {
    it('VALID: the whole statics => carries no clock-shaped placeholder', () => {
      const serialised = JSON.stringify(seedFixtureStatics);

      expect(/Date\.now|Math\.random|randomUUID/u.test(serialised)).toBe(false);
    });
  });
});
