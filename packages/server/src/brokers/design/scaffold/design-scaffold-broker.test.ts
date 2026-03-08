import { AbsoluteFilePathStub, QuestStub } from '@dungeonmaster/shared/contracts';
import { designScaffoldBroker } from './design-scaffold-broker';
import { designScaffoldBrokerProxy } from './design-scaffold-broker.proxy';

describe('designScaffoldBroker', () => {
  describe('successful scaffold', () => {
    it('VALID: {guildPath, questFolder, port} => returns designPath', async () => {
      designScaffoldBrokerProxy();

      const guildPath = AbsoluteFilePathStub({ value: '/home/user/my-project' });
      const questFolder = '001-add-auth';
      const port = QuestStub({ designPort: 5042 as never }).designPort!;

      const result = await designScaffoldBroker({ guildPath, questFolder, port });

      expect(result.designPath).toBe(
        '/home/user/my-project/.dungeonmaster-quests/001-add-auth/design',
      );
    });
  });

  describe('error cases', () => {
    it('ERROR: {write fails} => throws error', async () => {
      const proxy = designScaffoldBrokerProxy();
      proxy.setupWriteError({ error: new Error('EACCES: permission denied') });

      const guildPath = AbsoluteFilePathStub({ value: '/home/user/my-project' });
      const questFolder = '001-add-auth';
      const port = QuestStub({ designPort: 5042 as never }).designPort!;

      await expect(designScaffoldBroker({ guildPath, questFolder, port })).rejects.toThrow(
        /EACCES/u,
      );
    });
  });
});
