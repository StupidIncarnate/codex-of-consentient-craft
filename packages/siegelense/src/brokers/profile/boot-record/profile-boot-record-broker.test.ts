import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { SpecHashStub } from '../../../contracts/spec-hash/spec-hash.stub';

import { profileBootRecordBroker } from './profile-boot-record-broker';
import { profileBootRecordBrokerProxy } from './profile-boot-record-broker.proxy';

const HOME_DIR = '/home/user';
const HOME_PATH = FilePathStub({ value: '/home/user/.dungeonmaster' });
const ROOT_PATH = FilePathStub({ value: '/home/user/.dungeonmaster/siegelense' });
const NOW_MS = 1_700_000_000_000;

describe('profileBootRecordBroker', () => {
  describe('a measured boot', () => {
    it('VALID: {bootMs: 20000} => writes the boot record under the spec hash, carrying the measured time', async () => {
      const proxy = profileBootRecordBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_7f3a9c21' });
      const specHash = SpecHashStub({ value: 'a3f9c2e1' });
      const profilesPath = FilePathStub({
        value: '/home/user/.dungeonmaster/siegelense/profiles/a3f9c2e1',
      });
      proxy.setupBootRecordWrite({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        profilesPath,
        instanceId,
        nowMs: NOW_MS,
      });

      const record = await profileBootRecordBroker({
        instanceId,
        specHash,
        bootMs: EpochMsStub({ value: 20_000 }),
      });

      expect(record).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        specHash: 'a3f9c2e1',
        bootMs: 20_000,
        recordedAtMs: NOW_MS,
      });
      expect(proxy.getWrittenRecord({ profilesPath, instanceId })).toBe(
        `{"instanceId":"inst_7f3a9c21","specHash":"a3f9c2e1","bootMs":20000,"recordedAtMs":${String(NOW_MS)}}\n`,
      );
    });

    it('VALID: {a different spec hash} => the record lands under that hash, so a changed spec never reads the old timing', async () => {
      const proxy = profileBootRecordBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_9b2c4d11' });
      const specHash = SpecHashStub({ value: 'b1b1b1b1' });
      const profilesPath = FilePathStub({
        value: '/home/user/.dungeonmaster/siegelense/profiles/b1b1b1b1',
      });
      proxy.setupBootRecordWrite({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        profilesPath,
        instanceId,
        nowMs: NOW_MS,
      });

      await profileBootRecordBroker({
        instanceId,
        specHash,
        bootMs: EpochMsStub({ value: 31_500 }),
      });

      expect(proxy.getWrittenRecord({ profilesPath, instanceId })).toBe(
        `{"instanceId":"inst_9b2c4d11","specHash":"b1b1b1b1","bootMs":31500,"recordedAtMs":${String(NOW_MS)}}\n`,
      );
    });
  });
});
