import { GuildIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { InstanceManifestStub } from '../../../contracts/instance-manifest/instance-manifest.stub';
import { SpecNameStub } from '../../../contracts/spec-name/spec-name.stub';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';

import { SiegelenseStartResponder } from './siegelense-start-responder';
import { SiegelenseStartResponderProxy } from './siegelense-start-responder.proxy';

describe('SiegelenseStartResponder', () => {
  describe('a spec with a quest and a guild', () => {
    it('VALID: {specName, questId, guildId} => writes the complete InstanceManifest as one JSON document', async () => {
      const proxy = SiegelenseStartResponderProxy();
      const specName = SpecNameStub();
      const questId = QuestIdStub();
      const guildId = GuildIdStub();
      const manifest = InstanceManifestStub({ specName });
      proxy.stageManifest({ manifest });

      await SiegelenseStartResponder({ specName, questId, guildId });

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

      await SiegelenseStartResponder({ specName, questId: null, guildId: null });

      expect(proxy.getStartCallsMatching({ specName, questId: null, guildId: null })).toStrictEqual(
        [[{ specName, questId: null, guildId: null }]],
      );
    });
  });

  describe('instanceStartBroker throws', () => {
    it('ERROR: {broker throws} => the error propagates unchanged and stdout stays empty', async () => {
      const proxy = SiegelenseStartResponderProxy();
      const specName = SpecNameStub();
      const thrown = new Error('instanceStartBroker: boot failed');
      proxy.stageError({ error: thrown });

      await expect(
        SiegelenseStartResponder({ specName, questId: null, guildId: null }),
      ).rejects.toStrictEqual(thrown);
      expect(proxy.getStdoutWrites()).toStrictEqual([]);
    });
  });
});
