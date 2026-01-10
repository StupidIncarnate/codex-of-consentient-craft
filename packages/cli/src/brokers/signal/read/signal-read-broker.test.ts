import { signalReadBroker } from './signal-read-broker';
import { signalReadBrokerProxy } from './signal-read-broker.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

describe('signalReadBroker', () => {
  describe('successful read operations', () => {
    it('VALID: {questsFolderPath: "/quests"} => reads and parses signal file', async () => {
      const { fsReadFileProxy, fsUnlinkProxy } = signalReadBrokerProxy();
      const questsFolderPath = FilePathStub({ value: '/quests' });
      const signalJson = JSON.stringify({ type: 'quest-complete', questId: 'abc-123' });

      fsReadFileProxy.resolves({ content: signalJson });
      fsUnlinkProxy.succeeds();

      const result = await signalReadBroker({ questsFolderPath });

      expect(result).toStrictEqual({
        type: 'quest-complete',
        questId: 'abc-123',
      });
    });

    it('VALID: {questsFolderPath: "/quests"} => reads signal with message', async () => {
      const { fsReadFileProxy, fsUnlinkProxy } = signalReadBrokerProxy();
      const questsFolderPath = FilePathStub({ value: '/quests' });
      const signalJson = JSON.stringify({ type: 'quest-error', message: 'Something failed' });

      fsReadFileProxy.resolves({ content: signalJson });
      fsUnlinkProxy.succeeds();

      const result = await signalReadBroker({ questsFolderPath });

      expect(result).toStrictEqual({
        type: 'quest-error',
        message: 'Something failed',
      });
    });

    it('VALID: {questsFolderPath: "/quests"} => deletes signal file after reading', async () => {
      const { fsReadFileProxy, fsUnlinkProxy } = signalReadBrokerProxy();
      const questsFolderPath = FilePathStub({ value: '/quests' });
      const signalJson = JSON.stringify({ type: 'agent-ready' });

      fsReadFileProxy.resolves({ content: signalJson });
      fsUnlinkProxy.succeeds();

      await signalReadBroker({ questsFolderPath });

      expect(fsUnlinkProxy.succeeds).toBeDefined();
    });
  });

  describe('error conditions', () => {
    it('ERROR: {questsFolderPath: "/quests"} => throws when signal file not found', async () => {
      const { fsReadFileProxy } = signalReadBrokerProxy();
      const questsFolderPath = FilePathStub({ value: '/quests' });

      fsReadFileProxy.rejects({ error: new Error('Failed to read file at /quests/.cli-signal') });

      await expect(signalReadBroker({ questsFolderPath })).rejects.toThrow(/Failed to read file/u);
    });

    it('ERROR: {questsFolderPath: "/quests"} => throws when signal file has invalid JSON', async () => {
      const { fsReadFileProxy } = signalReadBrokerProxy();
      const questsFolderPath = FilePathStub({ value: '/quests' });

      fsReadFileProxy.resolves({ content: '{ invalid json }' });

      await expect(signalReadBroker({ questsFolderPath })).rejects.toThrow(/JSON/u);
    });

    it('ERROR: {questsFolderPath: "/quests"} => throws when signal content invalid', async () => {
      const { fsReadFileProxy } = signalReadBrokerProxy();
      const questsFolderPath = FilePathStub({ value: '/quests' });
      const invalidSignal = JSON.stringify({ type: 'unknown-type' });

      fsReadFileProxy.resolves({ content: invalidSignal });

      await expect(signalReadBroker({ questsFolderPath })).rejects.toThrow(/Invalid enum value/u);
    });
  });
});
