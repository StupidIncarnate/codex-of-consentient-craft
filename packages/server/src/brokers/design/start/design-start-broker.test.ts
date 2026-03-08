import { AbsoluteFilePathStub, QuestStub } from '@dungeonmaster/shared/contracts';
import { designStartBroker } from './design-start-broker';
import { designStartBrokerProxy } from './design-start-broker.proxy';

describe('designStartBroker', () => {
  describe('successful start', () => {
    it('VALID: {designPath, port} => returns kill function', async () => {
      designStartBrokerProxy();

      const designPath = AbsoluteFilePathStub({ value: '/home/user/project/design' });
      const port = QuestStub({ designPort: 5042 as never }).designPort!;

      const result = await designStartBroker({ designPath, port });

      expect(result.kill).toStrictEqual(expect.any(Function));
    });
  });

  describe('error cases', () => {
    it('ERROR: {npm install fails} => throws error', async () => {
      const proxy = designStartBrokerProxy();
      proxy.setupInstallError({ error: new Error('npm install failed') });

      const designPath = AbsoluteFilePathStub({ value: '/home/user/project/design' });
      const port = QuestStub({ designPort: 5042 as never }).designPort!;

      await expect(designStartBroker({ designPath, port })).rejects.toThrow(/npm install failed/u);
    });
  });
});
