import { GuildIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { InstanceManifestStub } from '../../../contracts/instance-manifest/instance-manifest.stub';
import { RecipeNameStub } from '../../../contracts/recipe-name/recipe-name.stub';
import { RepoLocalPathStub } from '../../../contracts/repo-local-path/repo-local-path.stub';
import { SeedResultStub } from '../../../contracts/seed-result/seed-result.stub';
import { SpecNameStub } from '../../../contracts/spec-name/spec-name.stub';
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

  describe('a quest named with no guild', () => {
    it('VALID: {questId, guildId: null} => forwards guildId null and the evidence path files under unowned', async () => {
      const proxy = SiegelenseStartResponderProxy();
      const specName = SpecNameStub();
      const questId = QuestIdStub();
      const instanceId = InstanceIdStub();
      // Mirrors locationsInstanceEvidencePathFindBroker's own join order for guildId: null —
      // [rootPath, unownedDir, instancesDir, instanceId] — built off its real directory constants
      // rather than a literal, since guildId (not questId) is what that broker partitions on.
      const evidencePath = [
        `/repo/.${locationsStatics.siegelense.dir}`,
        locationsStatics.siegelense.unownedDir,
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
        proxy.getStartCallsMatching({ specName, questId, guildId: null, seed: null }),
      ).toStrictEqual([[{ specName, questId, guildId: null, seed: null }]]);
      expect(proxy.getStdoutWrites()).toStrictEqual([startAnswerRenderTransformer({ manifest })]);
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
