import { z } from '#gateway/npm/zod';

import { claudePathSlugEncoderTransformer } from '@dungeonmaster/shared/transformers';

import { liveQuestTargetHarness } from '../../../../test/harnesses/live-quest-target/live-quest-target.harness';
import { dmRegistryBroker } from '../../dm/registry/dm-registry-broker';
import { recipesGuildActiveSuiteBroker } from './recipes-guild-active-suite-broker';

describe('recipesGuildActiveSuiteBroker', () => {
  describe('the manifest identity chunk 8 reads off this same export', () => {
    it('VALID: {} => carries its verbatim name, description, and no inputs', () => {
      expect({
        recipeName: recipesGuildActiveSuiteBroker.recipeName,
        description: recipesGuildActiveSuiteBroker.description,
        inputs: recipesGuildActiveSuiteBroker.inputs,
      }).toStrictEqual({
        recipeName: 'guild-active-suite',
        description:
          'one active guild holding two quests (one in progress, one complete) and a session with subagent chain',
        inputs: undefined,
      });
    });
  });

  describe('plan structure and listing', () => {
    it('VALID: {} => produces a plan making guild, 2 quests, session and subagent', () => {
      const plan = recipesGuildActiveSuiteBroker();
      const listing = dmRegistryBroker.listing(plan);

      expect(listing).toStrictEqual({
        runs: { serverless: true },
        makes: [
          { ingredient: 'guild', count: 1 },
          { ingredient: 'quest', count: 2 },
          { ingredient: 'session', count: 1 },
          { ingredient: 'subagent', count: 1 },
        ],
      });
    });
  });

  // DEF-71: on a live target the quest ingredient's `api` route walks the first freshly-minted
  // `created` quest to `in_progress` through the REAL `questReachRouteBroker`, hitting the REAL
  // `flows_approved`/`approved` gates on the way. Before the fix this threw
  // `Missing required content for transition to flows_approved`; this proves the walk now clears
  // both gates and stops only at the one hop `liveQuestTargetHarness` cannot honestly serve —
  // `POST /api/quests/:id/start` (`orchestration-start-responder`'s own logic being unexported).
  describe('run against a live target (api route, DEF-71)', () => {
    const liveTarget = liveQuestTargetHarness();

    it('VALID: {} => walks past the flows_approved and approved gates for real, stopping only at the unserved in_progress hop', async () => {
      const { run } = dmRegistryBroker;

      await expect(run(recipesGuildActiveSuiteBroker(), liveTarget.target())).rejects.toThrow(
        /^recipe "guild-active-suite": ingredient "quest"'s "api" route at http:\/\/live-quest-target\.test\/api\/quests\/[0-9a-f-]+\/start refused the connection: .*no in-process dispatch for POST \/api\/quests\/[0-9a-f-]+\/start/u,
      );
    });
  });

  // A separate, session-focused describe block: `simulateStartRoute: true` answers the
  // `in_progress` hop with a plain status flip (never the real relay-seeding responder — see the
  // harness's own header) so the plan can run all the way to its session/subagent creates, which the
  // DEF-71 gate test above never reaches (the whole plan aborts at the first quest's unserved
  // `in_progress` hop). Before this fix, `session`'s write route threw
  // `"lines": Required` naming "(unknown path)" — this recipe never called `set()` on its session or
  // subagent row at all.
  describe('run against a live target with the start hop simulated (session/subagent write route)', () => {
    const liveTarget = liveQuestTargetHarness({ simulateStartRoute: true });

    it('VALID: {} => the session and subagent both write for real, with the lines this recipe now supplies', async () => {
      const { run } = dmRegistryBroker;
      const target = liveTarget.target();

      const result = (await run(recipesGuildActiveSuiteBroker(), target)) as Record<
        PropertyKey,
        unknown
      >;
      const guild = result.guild as Record<PropertyKey, unknown>;
      const guildPath = z.string().parse(guild.path);
      const sessionsDir = claudePathSlugEncoderTransformer({
        homeDir: target.claudeHome,
        projectPath: guildPath,
      });

      expect({
        session: result.session,
        subagent: result.subagent,
      }).toStrictEqual({
        session: {
          sessionId: 'seed-session-1',
          cwd: guildPath,
          filePath: `${sessionsDir}/seed-session-1.jsonl`,
          lineCount: 2,
        },
        subagent: {
          agentId: 'seed-agent-1',
          toolUseId: 'toolu_seed1',
          filePath: `${sessionsDir}/seed-session-1/subagents/agent-seed-agent-1.jsonl`,
          lineCount: 1,
        },
      });
    });
  });
});
