import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { InstanceManifestStub } from '../../../contracts/instance-manifest/instance-manifest.stub';
import { RecipeListingEntryStub } from '../../../contracts/recipe-listing-entry/recipe-listing-entry.stub';
import { RepoLocalPathStub } from '../../../contracts/repo-local-path/repo-local-path.stub';
import { SeedResultStub } from '../../../contracts/seed-result/seed-result.stub';
import { RecipeUnknownError } from '../../../errors/recipe-unknown/recipe-unknown-error';
import { SeedRecipeNeedsInputError } from '../../../errors/seed-recipe-needs-input/seed-recipe-needs-input-error';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';

import { startAnswerRenderTransformer } from '../../../transformers/start-answer-render/start-answer-render-transformer';
import { SiegelenseStartResponder } from './siegelense-start-responder';
import { SiegelenseStartResponderProxy } from './siegelense-start-responder.proxy';

describe('SiegelenseStartResponder', () => {
  describe('a spec with a quest and a guild', () => {
    it('VALID: {specName, questId, guildId} => writes the human summary by default', async () => {
      const proxy = SiegelenseStartResponderProxy();
      const specName = 'dungeonmaster-stack';
      const questId = QuestIdStub();
      const guildId = GuildIdStub();
      const manifest = InstanceManifestStub({ specName });
      proxy.stageManifest({ manifest });

      await SiegelenseStartResponder({ specName, questId, guildId, seed: null });

      expect(proxy.getStdoutWrites()).toStrictEqual([startAnswerRenderTransformer({ manifest })]);
    });

    it('VALID: {questId, guildId both given} => never calls questOwningGuildFindBroker, the explicit guildId wins', async () => {
      const proxy = SiegelenseStartResponderProxy();
      const specName = 'dungeonmaster-stack';
      const questId = QuestIdStub();
      const guildId = GuildIdStub();
      const manifest = InstanceManifestStub({ specName });
      proxy.stageManifest({ manifest });

      await SiegelenseStartResponder({ specName, questId, guildId, seed: null });

      expect(proxy.getOwningGuildFindCallsMatching({ questId })).toStrictEqual([]);
      expect(proxy.getStartCallsMatching({ specName, questId, guildId, seed: null })).toStrictEqual(
        [[{ specName, questId, guildId, seed: null, repoRoot: '/default/cwd' }]],
      );
    });

    it('VALID: {isJson: true} => writes the complete InstanceManifest as one JSON document', async () => {
      const proxy = SiegelenseStartResponderProxy();
      const specName = 'dungeonmaster-stack';
      const questId = QuestIdStub();
      const guildId = GuildIdStub();
      const manifest = InstanceManifestStub({ specName });
      proxy.stageManifest({ manifest });

      await SiegelenseStartResponder({ specName, questId, guildId, seed: null, isJson: true });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify({ ...manifest, idleTimeoutMs: 900_000 }, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });
  });

  describe('a raised idle timeout', () => {
    it('VALID: {idleTimeoutMs: 1_800_000} => the human summary states the raised timeout', async () => {
      const proxy = SiegelenseStartResponderProxy();
      const specName = 'dungeonmaster-stack';
      const manifest = InstanceManifestStub({ specName });
      const idleTimeoutMs = 1_800_000;
      proxy.stageManifest({ manifest });

      await SiegelenseStartResponder({
        specName,
        questId: null,
        guildId: null,
        seed: null,
        idleTimeoutMs,
      });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        startAnswerRenderTransformer({ manifest, idleTimeoutMs }),
      ]);
      expect(startAnswerRenderTransformer({ manifest, idleTimeoutMs }).split('\n')[6]).toBe(
        'IDLE TIMEOUT: 30m (raised from the 15m default)',
      );
    });

    it('VALID: {idleTimeoutMs: 1_800_000, isJson: true} => the JSON document carries idleTimeoutMs 1800000', async () => {
      const proxy = SiegelenseStartResponderProxy();
      const specName = 'dungeonmaster-stack';
      const manifest = InstanceManifestStub({ specName });
      proxy.stageManifest({ manifest });

      await SiegelenseStartResponder({
        specName,
        questId: null,
        guildId: null,
        seed: null,
        idleTimeoutMs: 1_800_000,
        isJson: true,
      });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify({ ...manifest, idleTimeoutMs: 1_800_000 }, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });
  });

  describe('no quest and no guild named', () => {
    it('VALID: {no quest, no guild} => calls instanceStartBroker with questId null and guildId null', async () => {
      const proxy = SiegelenseStartResponderProxy();
      const specName = 'dungeonmaster-stack';
      const manifest = InstanceManifestStub({ specName });
      proxy.stageManifest({ manifest });

      await SiegelenseStartResponder({ specName, questId: null, guildId: null, seed: null });

      expect(
        proxy.getStartCallsMatching({ specName, questId: null, guildId: null, seed: null }),
      ).toStrictEqual([
        [{ specName, questId: null, guildId: null, seed: null, repoRoot: '/default/cwd' }],
      ]);
    });
  });

  describe('a quest named with no guild, and the quest resolves to a guild', () => {
    it('VALID: {questId, guildId: null} => resolves the owning guild and files evidence under it, never unowned', async () => {
      const proxy = SiegelenseStartResponderProxy();
      const specName = 'dungeonmaster-stack';
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
      ).toStrictEqual([
        [{ specName, questId, guildId: resolvedGuildId, seed: null, repoRoot: '/default/cwd' }],
      ]);
      expect(proxy.getStdoutWrites()).toStrictEqual([startAnswerRenderTransformer({ manifest })]);
    });
  });

  describe('a quest named with no guild, and the quest cannot be resolved to any guild', () => {
    it('ERROR: {questId not found by any registered guild} => refuses before instanceStartBroker ever runs', async () => {
      const proxy = SiegelenseStartResponderProxy();
      const specName = 'dungeonmaster-stack';
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
      const specName = 'dungeonmaster-stack';
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
      ).toStrictEqual([
        [{ specName, questId: null, guildId, seed: null, repoRoot: '/default/cwd' }],
      ]);
      expect(proxy.getStdoutWrites()).toStrictEqual([startAnswerRenderTransformer({ manifest })]);
    });
  });

  describe('a seed recipe whose bound name resolves to a bare id', () => {
    it('VALID: {seed, seeded: bare id} => forwards seed and writes a SEEDED line carrying just that id', async () => {
      const proxy = SiegelenseStartResponderProxy();
      const specName = 'dungeonmaster-stack';
      const seed = 'guild-mid-execution';
      const seeded = SeedResultStub({ guild: 'a1b2c3d4-5e6f-4890-abcd-ef1234567890' });
      const manifest = InstanceManifestStub({ specName, seeded });
      proxy.stageRecipeListing({
        entries: [RecipeListingEntryStub({ recipeName: seed, inputKeys: [] })],
      });
      proxy.stageManifest({ manifest });

      await SiegelenseStartResponder({ specName, questId: null, guildId: null, seed });

      expect(
        proxy.getStartCallsMatching({ specName, questId: null, guildId: null, seed }),
      ).toStrictEqual([
        [{ specName, questId: null, guildId: null, seed, repoRoot: '/default/cwd' }],
      ]);
      expect(proxy.getStdoutWrites()).toStrictEqual([startAnswerRenderTransformer({ manifest })]);
    });

    it('VALID: {seed, seeded: bare id, isJson: true} => the JSON document carries the bare id', async () => {
      const proxy = SiegelenseStartResponderProxy();
      const specName = 'dungeonmaster-stack';
      const seed = 'guild-mid-execution';
      const seeded = SeedResultStub({ guild: 'a1b2c3d4-5e6f-4890-abcd-ef1234567890' });
      const manifest = InstanceManifestStub({ specName, seeded });
      proxy.stageRecipeListing({
        entries: [RecipeListingEntryStub({ recipeName: seed, inputKeys: [] })],
      });
      proxy.stageManifest({ manifest });

      await SiegelenseStartResponder({
        specName,
        questId: null,
        guildId: null,
        seed,
        isJson: true,
      });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify({ ...manifest, idleTimeoutMs: 900_000 }, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });
  });

  describe('a seed recipe whose bound name resolves to a saved row', () => {
    it('VALID: {seed, seeded: full row} => forwards seed and writes a SEEDED line with the id and identity fields', async () => {
      const proxy = SiegelenseStartResponderProxy();
      const specName = 'dungeonmaster-stack';
      const seed = 'guild-mid-execution';
      const seeded = SeedResultStub();
      const manifest = InstanceManifestStub({ specName, seeded });
      proxy.stageRecipeListing({
        entries: [RecipeListingEntryStub({ recipeName: seed, inputKeys: [] })],
      });
      proxy.stageManifest({ manifest });

      await SiegelenseStartResponder({ specName, questId: null, guildId: null, seed });

      expect(
        proxy.getStartCallsMatching({ specName, questId: null, guildId: null, seed }),
      ).toStrictEqual([
        [{ specName, questId: null, guildId: null, seed, repoRoot: '/default/cwd' }],
      ]);
      expect(proxy.getStdoutWrites()).toStrictEqual([startAnswerRenderTransformer({ manifest })]);
    });

    it('VALID: {seed, seeded: full row, isJson: true} => the JSON document carries the whole saved row', async () => {
      const proxy = SiegelenseStartResponderProxy();
      const specName = 'dungeonmaster-stack';
      const seed = 'guild-mid-execution';
      const seeded = SeedResultStub();
      const manifest = InstanceManifestStub({ specName, seeded });
      proxy.stageRecipeListing({
        entries: [RecipeListingEntryStub({ recipeName: seed, inputKeys: [] })],
      });
      proxy.stageManifest({ manifest });

      await SiegelenseStartResponder({
        specName,
        questId: null,
        guildId: null,
        seed,
        isJson: true,
      });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify({ ...manifest, idleTimeoutMs: 900_000 }, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });
  });

  describe('a seed recipe whose listing entry declares no inputs', () => {
    it('VALID: {seed, listing entry present with inputKeys: []} => proceeds and forwards seed unchanged', async () => {
      const proxy = SiegelenseStartResponderProxy();
      const specName = 'dungeonmaster-stack';
      const seed = 'guild-mid-execution';
      const seeded = SeedResultStub();
      const manifest = InstanceManifestStub({ specName, seeded });
      proxy.stageRecipeListing({
        entries: [RecipeListingEntryStub({ recipeName: seed, inputKeys: [] })],
      });
      proxy.stageManifest({ manifest });

      await SiegelenseStartResponder({ specName, questId: null, guildId: null, seed });

      expect(
        proxy.getStartCallsMatching({ specName, questId: null, guildId: null, seed }),
      ).toStrictEqual([
        [{ specName, questId: null, guildId: null, seed, repoRoot: '/default/cwd' }],
      ]);
    });
  });

  describe('a seed recipe whose listing entry declares an input', () => {
    it('ERROR: {seed, listing entry present with inputKeys: [guildId]} => refuses before instanceStartBroker ever runs', async () => {
      const proxy = SiegelenseStartResponderProxy();
      const specName = 'dungeonmaster-stack';
      const seed = 'quest-advances-one-step';
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

  describe('a --seed recipe the listing does not hold', () => {
    it("ERROR: {seed: nope, empty listing} => refuses with the run seed step's own wording, naming every known recipe", async () => {
      const proxy = SiegelenseStartResponderProxy();
      const specName = 'dungeonmaster-stack';
      const seed = 'nope';
      proxy.stageRecipeListing({
        entries: [
          RecipeListingEntryStub({ recipeName: 'guild-empty' }),
          RecipeListingEntryStub({ recipeName: 'guild-mid-execution' }),
        ],
      });

      await expect(
        SiegelenseStartResponder({ specName, questId: null, guildId: null, seed }),
      ).rejects.toStrictEqual(
        new RecipeUnknownError({
          recipeName: seed,
          known: ['guild-empty', 'guild-mid-execution'],
        }),
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
      const specName = 'dungeonmaster-stack';
      const thrown = new Error('instanceStartBroker: boot failed');
      proxy.stageError({ error: thrown, specName });

      await expect(
        SiegelenseStartResponder({ specName, questId: null, guildId: null, seed: null }),
      ).rejects.toStrictEqual(thrown);
      expect(proxy.getStdoutWrites()).toStrictEqual([]);
    });
  });

  describe('the served build', () => {
    it('VALID: {served build older than its source} => writes the exact stale-build warning to stderr and the summary to stdout', async () => {
      const proxy = SiegelenseStartResponderProxy();
      const specName = 'dungeonmaster-stack';
      const manifest = InstanceManifestStub({ specName });
      const warning = [
        'STALE BUILD: this lane serves packages/web/dist, last built 2026-09-29T21:35:38.233Z at commit fd13432c156a; 1 file has changed since, and the lane serves none of those changes: packages/web/src/app.tsx.',
        'REBUILD: run `npm run build` while no lane is live in this checkout — a build empties the folder a live lane serves — then start again.',
        '',
      ].join('\n');
      proxy.stageStaleWarning({ specName, warning });
      proxy.stageManifest({ manifest });

      await SiegelenseStartResponder({ specName, questId: null, guildId: null, seed: null });

      expect({
        stderr: proxy.getStderrWrites(),
        stdout: proxy.getStdoutWrites(),
      }).toStrictEqual({
        stderr: [warning],
        stdout: [startAnswerRenderTransformer({ manifest })],
      });
    });

    it('EMPTY: {served build current} => writes nothing to stderr', async () => {
      const proxy = SiegelenseStartResponderProxy();
      const specName = 'dungeonmaster-stack';
      const manifest = InstanceManifestStub({ specName });
      proxy.stageManifest({ manifest });

      await SiegelenseStartResponder({ specName, questId: null, guildId: null, seed: null });

      expect(proxy.getStderrWrites()).toStrictEqual([]);
    });

    it('ERROR: {stale-build check throws} => says so on stderr and still boots', async () => {
      const proxy = SiegelenseStartResponderProxy();
      const specName = 'dungeonmaster-stack';
      const manifest = InstanceManifestStub({ specName });
      proxy.stageStaleCheckError({
        specName,
        error: new Error('EACCES: permission denied, stat'),
      });
      proxy.stageManifest({ manifest });

      await SiegelenseStartResponder({ specName, questId: null, guildId: null, seed: null });

      expect({
        stderr: proxy.getStderrWrites(),
        stdout: proxy.getStdoutWrites(),
      }).toStrictEqual({
        stderr: [
          "[siegelense start] the stale-build check failed, so nothing says whether this lane's compiled output is current: EACCES: permission denied, stat\n",
        ],
        stdout: [startAnswerRenderTransformer({ manifest })],
      });
    });
  });
});
