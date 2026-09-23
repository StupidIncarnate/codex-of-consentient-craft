import { SavedRecordNameStub } from '@dungeonmaster/hydration/contracts';
import { QuestStub } from '@dungeonmaster/shared/contracts';
import type { GuildStub } from '@dungeonmaster/shared/contracts';

import { fileTargetHarness } from '../../../../test/harnesses/file-target/file-target.harness';
import { instanceStubHarness } from '../../../../test/harnesses/instance-stub/instance-stub.harness';
import { recipesSeedRunBroker } from './recipes-seed-run-broker';

type Guild = ReturnType<typeof GuildStub>;
type Quest = ReturnType<typeof QuestStub>;

const DUNGEONMASTER_HOME_ENV_VAR = 'DUNGEONMASTER_HOME';
const UNUSED_HOME = '/tmp/recipes-seed-run-broker-unused';
const GUILD_NAME = SavedRecordNameStub({ value: 'guild' });
const QUEST1_NAME = SavedRecordNameStub({ value: 'quest1' });
const QUEST2_NAME = SavedRecordNameStub({ value: 'quest2' });
const QUEST3_NAME = SavedRecordNameStub({ value: 'quest3' });

describe('recipesSeedRunBroker', () => {
  describe('an unknown recipe', () => {
    it('INVALID: {recipeName: "no-such-recipe"} => throws listing the recipes that exist', async () => {
      await expect(
        recipesSeedRunBroker({ recipeName: 'no-such-recipe', home: UNUSED_HOME }),
      ).rejects.toThrow(
        /^recipesSeedRunBroker: unknown recipe 'no-such-recipe' — known recipes: guild-empty, guild-with-three-quests, guild-mid-execution, quest-advances-one-step, quest-completed, session-single-turn, session-with-nested-chain, guild-active-suite, session-with-nested-subagent$/u,
      );
    });
  });

  describe('params on a paramless recipe', () => {
    it('INVALID: {recipeName: guild-mid-execution, params: {x}} => throws naming the recipe and the keys supplied', async () => {
      await expect(
        recipesSeedRunBroker({
          recipeName: 'guild-mid-execution',
          params: { x: 1 },
          home: UNUSED_HOME,
        }),
      ).rejects.toThrow(
        /^recipesSeedRunBroker: recipe 'guild-mid-execution' takes no params, got: x$/u,
      );
    });
  });

  describe('a bad input value', () => {
    it("INVALID: {recipeName: quest-advances-one-step, params: {guildId: 'not-a-uuid'}} => throws the recipe's own refusal", async () => {
      await expect(
        recipesSeedRunBroker({
          recipeName: 'quest-advances-one-step',
          params: { guildId: 'not-a-uuid' },
          home: UNUSED_HOME,
        }),
      ).rejects.toThrow(
        /^recipesSeedRunBroker: recipe 'quest-advances-one-step' refused params — [\s\S]*guildId[\s\S]* — this recipe takes: guildId$/u,
      );
    });
  });

  describe('a missing declared param', () => {
    it('INVALID: {recipeName: session-with-nested-chain, params: undefined} => throws naming the missing key and listing the inputs', async () => {
      await expect(
        recipesSeedRunBroker({ recipeName: 'session-with-nested-chain', home: UNUSED_HOME }),
      ).rejects.toThrow(
        /^recipesSeedRunBroker: recipe 'session-with-nested-chain' refused params — [\s\S]*guildPath[\s\S]* — this recipe takes: guildPath$/u,
      );
    });
  });

  describe('seeding a real recipe against a real temporary directory', () => {
    const fileTarget = fileTargetHarness();

    it('VALID: {recipeName: guild-mid-execution, home} => saves the real records and restores DUNGEONMASTER_HOME to its prior value', async () => {
      process.env[DUNGEONMASTER_HOME_ENV_VAR] = 'sentinel-previous-home-recipes-seed-run-broker';

      const result = await recipesSeedRunBroker({
        recipeName: 'guild-mid-execution',
        home: fileTarget.target().home,
      });
      const guild = result[GUILD_NAME] as Guild;
      const quest1 = result[QUEST1_NAME] as Quest;
      const quest2 = result[QUEST2_NAME] as Quest;
      const quest3 = result[QUEST3_NAME] as Quest;

      expect({
        savedNames: Object.keys(result).sort(),
        guildName: guild.name,
        guildUrlSlug: guild.urlSlug,
        questTitles: [quest1.title, quest2.title, quest3.title],
        dungeonmasterHomeAfterwards: process.env[DUNGEONMASTER_HOME_ENV_VAR],
      }).toStrictEqual({
        savedNames: ['guild', 'quest1', 'quest2', 'quest3'],
        guildName: 'Guild 1',
        guildUrlSlug: 'guild-1',
        questTitles: ['The running one', 'Quest 2', 'Quest 3'],
        dungeonmasterHomeAfterwards: 'sentinel-previous-home-recipes-seed-run-broker',
      });
    });
  });

  describe('a write route that throws', () => {
    const fileTarget = fileTargetHarness();

    it('ERROR: {a write route into a read-only home} => DUNGEONMASTER_HOME is still restored', async () => {
      const { home } = fileTarget.target();
      fileTarget.denyWrites();
      process.env[DUNGEONMASTER_HOME_ENV_VAR] = 'sentinel-previous-home-error-path';

      await expect(
        recipesSeedRunBroker({ recipeName: 'guild-mid-execution', home }),
      ).rejects.toThrow(
        /^recipe "guild-mid-execution": ingredient "guild"'s write route failed writing ".+": Error: EACCES: permission denied, .+$/u,
      );

      fileTarget.allowWrites();

      expect(process.env[DUNGEONMASTER_HOME_ENV_VAR]).toBe('sentinel-previous-home-error-path');
    });
  });

  describe('a baseUrl supplied on a recipe whose ingredient declares an api route', () => {
    const instanceStub = instanceStubHarness();

    // `quest-advances-one-step` asks for `status: 'in_progress'` via `setRaw`, folded straight
    // into the create op's fields (`plan-fold-writes-transformer.ts`) — the real create endpoint
    // never reads that field off the wire, so `questApiRouteBroker` walks the freshly-minted
    // `created` quest there through `questReachRouteBroker` once the create+reload round trip
    // lands. This stub server only echoes a canned quest — it never persists one — so the walk's
    // first hop (`questModifyBroker`, called in-process against `home`) finds no real quest file
    // to modify and the run throws rather than silently keeping the quest at `created`. Proving the
    // walk itself SUCCEEDS needs a real orchestrator HTTP server backing `home` with real
    // `questCreateBroker`/`questModifyBroker`/`questGetBroker` behavior — a heavier harness than
    // this package owns today.
    it('ERROR: {recipeName: quest-advances-one-step, baseUrl} => the api route wins over write, posts the real request, then throws walking to the requested status rather than silently landing on created', async () => {
      const apiQuest = QuestStub({
        id: 'server-minted-quest',
        folder: '002-server-minted-quest',
        title: 'Server-minted title',
        status: 'created',
        operations: [],
      });
      const baseUrl = String(await instanceStub.start({ status: 201, body: apiQuest }));

      await expect(
        recipesSeedRunBroker({
          recipeName: 'quest-advances-one-step',
          params: { guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
          home: UNUSED_HOME,
          baseUrl,
        }),
      ).rejects.toThrow(
        /^recipe "quest-advances-one-step": ingredient "quest"'s "api" route failed with no URL known: Error: questReachRouteBroker: could not reach "explore_flows" — .+$/u,
      );

      expect(instanceStub.lastRequest()).toStrictEqual({
        method: 'POST',
        path: '/api/quests',
        body: {
          guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          title: 'Advancing quest',
          userRequest: 'seeded quest 1',
        },
      });
    });
  });
});
