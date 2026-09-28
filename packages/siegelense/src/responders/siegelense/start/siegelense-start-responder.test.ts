import { GuildIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { InstanceManifestStub } from '../../../contracts/instance-manifest/instance-manifest.stub';
import { RecipeListingEntryStub } from '../../../contracts/recipe-listing-entry/recipe-listing-entry.stub';
import { RecipeNameStub } from '../../../contracts/recipe-name/recipe-name.stub';
import { RepoLocalPathStub } from '../../../contracts/repo-local-path/repo-local-path.stub';
import { SeedResultStub } from '../../../contracts/seed-result/seed-result.stub';
import { SpecNameStub } from '../../../contracts/spec-name/spec-name.stub';
import { SeedRecipeNeedsInputError } from '../../../errors/seed-recipe-needs-input/seed-recipe-needs-input-error';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';

import { startAnswerRenderTransformer } from '../../../transformers/start-answer-render/start-answer-render-transformer';
import { SiegelenseStartResponder } from './siegelense-start-responder';
import { SiegelenseStartResponderProxy } from './siegelense-start-responder.proxy';

describe('SiegelenseStartResponder', () => {
  describe('a spec with a quest and a guild', () => {
    it('VALID: {specName, questId, guildId} => writes the human summary by default', async () => {
      const proxy = SiegelenseStartResponderProxy();
      const specName = SpecNameStub();
      const questId = QuestIdStub();
      const guildId = GuildIdStub();
      const manifest = InstanceManifestStub({ specName });
      proxy.stageManifest({ manifest });

      await SiegelenseStartResponder({ specName, questId, guildId, seed: null });

      expect(proxy.getStdoutWrites()).toStrictEqual([startAnswerRenderTransformer({ manifest })]);
    });

    it('VALID: {questId, guildId both given} => never calls questOwningGuildFindBroker, the explicit guildId wins', async () => {
      const proxy = SiegelenseStartResponderProxy();
      const specName = SpecNameStub();
      const questId = QuestIdStub();
      const guildId = GuildIdStub();
      const manifest = InstanceManifestStub({ specName });
      proxy.stageManifest({ manifest });

      await SiegelenseStartResponder({ specName, questId, guildId, seed: null });

      expect(proxy.getOwningGuildFindCallsMatching({ questId })).toStrictEqual([]);
      expect(proxy.getStartCallsMatching({ specName, questId, guildId, seed: null })).toStrictEqual(
        [[{ specName, questId, guildId, seed: null }]],
      );
    });

    it('VALID: {isJson: true} => writes the complete InstanceManifest as one JSON document', async () => {
      const proxy = SiegelenseStartResponderProxy();
      const specName = SpecNameStub();
      const questId = QuestIdStub();
      const guildId = GuildIdStub();
      const manifest = InstanceManifestStub({ specName });
      proxy.stageManifest({ manifest });

      await SiegelenseStartResponder({ specName, questId, guildId, seed: null, isJson: true });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(manifest, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });
  });

  describe('no quest and no guild named', () => {
    it('VALID: {no quest, no guild} => calls instanceStartBroker with questId null and guildId null', async () => {
      const proxy = SiegelenseStartResponderProxy();
      const specName = SpecNameStub();
      const manifest = InstanceManifestStub({ specName });
      proxy.stageManifest({ manifest });

      await SiegelenseStartResponder({ specName, questId: null, guildId: null, seed: null });

      expect(
        proxy.getStartCallsMatching({ specName, questId: null, guildId: null, seed: null }),
      ).toStrictEqual([[{ specName, questId: null, guildId: null, seed: null }]]);
    });
  });

  describe('a quest named with no guild, and the quest resolves to a guild', () => {
    it('VALID: {questId, guildId: null} => resolves the owning guild and files evidence under it, never unowned', async () => {
      const proxy = SiegelenseStartResponderProxy();
      const specName = SpecNameStub();
      const questId = QuestIdStub();
      const resolvedGuildId = GuildIdStub();
      const instanceId = InstanceIdStub();
      proxy.stageQuestResolvesToGuild({ questId, guildId: resolvedGuildId });
      // Same join order as the explicit-guild case below: [rootPath, guildsDir, guildId,
      // instancesDir, instanceId] — proving the RESOLVED guild, not `unowned`, is what evidence
      // ends up filed under.
      const evidencePath = [
        `/repo/.${locationsStatics.siegelense.dir}`,
        locationsStatics.siegelense.guildsDir,
        resolvedGuildId,
        locationsStatics.siegelense.instancesDir,
        instanceId,
      ].join('/');
      const manifest = InstanceManifestStub({
        instanceId,
        specName,
        evidence: RepoLocalPathStub({ path: evidencePath }),
      });
      proxy.stageManifest({ manifest });

      await SiegelenseStartResponder({ specName, questId, guildId: null, seed: null });

      expect(
        proxy.getStartCallsMatching({ specName, questId, guildId: resolvedGuildId, seed: null }),
      ).toStrictEqual([[{ specName, questId, guildId: resolvedGuildId, seed: null }]]);
      expect(proxy.getStdoutWrites()).toStrictEqual([startAnswerRenderTransformer({ manifest })]);
    });
  });

  describe('a quest named with no guild, and the quest cannot be resolved to any guild', () => {
    it('ERROR: {questId not found by any registered guild} => refuses before instanceStartBroker ever runs', async () => {
      const proxy = SiegelenseStartResponderProxy();
      const specName = SpecNameStub();
      const questId = QuestIdStub();
      const thrown = new Error(
        `--quest ${questId} could not be resolved to a guild: no registered guild's quest list ` +
          `contains it. Pass --guild explicitly, or check that DUNGEONMASTER_HOME points at the ` +
          `home this quest's guild is registered under.`,
      );
      proxy.stageQuestUnresolvable({ questId, error: thrown });

      await expect(
        SiegelenseStartResponder({ specName, questId, guildId: null, seed: null }),
      ).rejects.toStrictEqual(thrown);

      expect(
        proxy.getStartCallsMatching({ specName, questId, guildId: null, seed: null }),
      ).toStrictEqual([]);
      expect(proxy.getStdoutWrites()).toStrictEqual([]);
    });
  });

  describe('a guild named with no quest', () => {
    it('VALID: {guildId, questId: null} => forwards questId null and the evidence path files under that guild', async () => {
      const proxy = SiegelenseStartResponderProxy();
      const specName = SpecNameStub();
      const guildId = GuildIdStub();
      const instanceId = InstanceIdStub();
      // Same join order, guildId branch: [rootPath, guildsDir, guildId, instancesDir, instanceId].
      const evidencePath = [
        `/repo/.${locationsStatics.siegelense.dir}`,
        locationsStatics.siegelense.guildsDir,
        guildId,
        locationsStatics.siegelense.instancesDir,
        instanceId,
      ].join('/');
      const manifest = InstanceManifestStub({
        instanceId,
        specName,
        evidence: RepoLocalPathStub({ path: evidencePath }),
      });
      proxy.stageManifest({ manifest });

      await SiegelenseStartResponder({ specName, questId: null, guildId, seed: null });

      expect(
        proxy.getStartCallsMatching({ specName, questId: null, guildId, seed: null }),
      ).toStrictEqual([[{ specName, questId: null, guildId, seed: null }]]);
      expect(proxy.getStdoutWrites()).toStrictEqual([startAnswerRenderTransformer({ manifest })]);
    });
  });

  describe('a seed recipe whose bound name resolves to a bare id', () => {
    it('VALID: {seed, seeded: bare id} => forwards seed and writes a SEEDED line carrying just that id', async () => {
      const proxy = SiegelenseStartResponderProxy();
      const specName = SpecNameStub();
      const seed = RecipeNameStub();
      const seeded = SeedResultStub({ guild: 'a1b2c3d4-5e6f-4890-abcd-ef1234567890' });
      const manifest = InstanceManifestStub({ specName, seeded });
      proxy.stageManifest({ manifest });

      await SiegelenseStartResponder({ specName, questId: null, guildId: null, seed });

      expect(
        proxy.getStartCallsMatching({ specName, questId: null, guildId: null, seed }),
      ).toStrictEqual([[{ specName, questId: null, guildId: null, seed }]]);
      expect(proxy.getStdoutWrites()).toStrictEqual([startAnswerRenderTransformer({ manifest })]);
    });

    it('VALID: {seed, seeded: bare id, isJson: true} => the JSON document carries the bare id', async () => {
      const proxy = SiegelenseStartResponderProxy();
      const specName = SpecNameStub();
      const seed = RecipeNameStub();
      const seeded = SeedResultStub({ guild: 'a1b2c3d4-5e6f-4890-abcd-ef1234567890' });
      const manifest = InstanceManifestStub({ specName, seeded });
      proxy.stageManifest({ manifest });

      await SiegelenseStartResponder({
        specName,
        questId: null,
        guildId: null,
        seed,
        isJson: true,
      });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(manifest, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });
  });

  describe('a seed recipe whose bound name resolves to a saved row', () => {
    it('VALID: {seed, seeded: full row} => forwards seed and writes a SEEDED line with the id and identity fields', async () => {
      const proxy = SiegelenseStartResponderProxy();
      const specName = SpecNameStub();
      const seed = RecipeNameStub();
      const seeded = SeedResultStub();
      const manifest = InstanceManifestStub({ specName, seeded });
      proxy.stageManifest({ manifest });

      await SiegelenseStartResponder({ specName, questId: null, guildId: null, seed });

      expect(
        proxy.getStartCallsMatching({ specName, questId: null, guildId: null, seed }),
      ).toStrictEqual([[{ specName, questId: null, guildId: null, seed }]]);
      expect(proxy.getStdoutWrites()).toStrictEqual([startAnswerRenderTransformer({ manifest })]);
    });

    it('VALID: {seed, seeded: full row, isJson: true} => the JSON document carries the whole saved row', async () => {
      const proxy = SiegelenseStartResponderProxy();
      const specName = SpecNameStub();
      const seed = RecipeNameStub();
      const seeded = SeedResultStub();
      const manifest = InstanceManifestStub({ specName, seeded });
      proxy.stageManifest({ manifest });

      await SiegelenseStartResponder({
        specName,
        questId: null,
        guildId: null,
        seed,
        isJson: true,
      });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(manifest, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });
  });

  describe('a seed recipe whose listing entry declares no inputs', () => {
    it('VALID: {seed, listing entry present with inputKeys: []} => proceeds and forwards seed unchanged', async () => {
      const proxy = SiegelenseStartResponderProxy();
      const specName = SpecNameStub();
      const seed = RecipeNameStub();
      const seeded = SeedResultStub();
      const manifest = InstanceManifestStub({ specName, seeded });
      proxy.stageRecipeListing({
        entries: [RecipeListingEntryStub({ recipeName: seed, inputKeys: [] })],
      });
      proxy.stageManifest({ manifest });

      await SiegelenseStartResponder({ specName, questId: null, guildId: null, seed });

      expect(
        proxy.getStartCallsMatching({ specName, questId: null, guildId: null, seed }),
      ).toStrictEqual([[{ specName, questId: null, guildId: null, seed }]]);
    });
  });

  describe('a seed recipe whose listing entry declares an input', () => {
    it('ERROR: {seed, listing entry present with inputKeys: [guildId]} => refuses before instanceStartBroker ever runs', async () => {
      const proxy = SiegelenseStartResponderProxy();
      const specName = SpecNameStub();
      const seed = RecipeNameStub({ value: 'quest-advances-one-step' });
      proxy.stageRecipeListing({
        entries: [RecipeListingEntryStub({ recipeName: seed, inputKeys: ['guildId'] })],
      });

      await expect(
        SiegelenseStartResponder({ specName, questId: null, guildId: null, seed }),
      ).rejects.toStrictEqual(
        new SeedRecipeNeedsInputError({ recipeName: seed, inputKeys: ['guildId'] }),
      );

      expect(
        proxy.getStartCallsMatching({ specName, questId: null, guildId: null, seed }),
      ).toStrictEqual([]);
      expect(proxy.getStdoutWrites()).toStrictEqual([]);
    });
  });

  describe('instanceStartBroker throws', () => {
    it('ERROR: {broker throws} => the error propagates unchanged and stdout stays empty', async () => {
      const proxy = SiegelenseStartResponderProxy();
      const specName = SpecNameStub();
      const thrown = new Error('instanceStartBroker: boot failed');
      proxy.stageError({ error: thrown });

      await expect(
        SiegelenseStartResponder({ specName, questId: null, guildId: null, seed: null }),
      ).rejects.toStrictEqual(thrown);
      expect(proxy.getStdoutWrites()).toStrictEqual([]);
    });
  });
});
