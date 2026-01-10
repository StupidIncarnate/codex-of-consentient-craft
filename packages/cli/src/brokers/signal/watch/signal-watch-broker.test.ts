import { signalWatchBroker } from './signal-watch-broker';
import { signalWatchBrokerProxy } from './signal-watch-broker.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

describe('signalWatchBroker', () => {
  describe('successful watch operations', () => {
    it('VALID: {questsFolderPath: "/quests"} => resolves with signal when .cli-signal appears', async () => {
      const { fsWatchProxy, signalReadProxy } = signalWatchBrokerProxy();
      const questsFolderPath = FilePathStub({ value: '/quests' });
      const signalJson = JSON.stringify({ type: 'quest-complete', questId: 'abc-123' });

      signalReadProxy.fsReadFileProxy.resolves({ content: signalJson });
      signalReadProxy.fsUnlinkProxy.succeeds();

      const resultPromise = signalWatchBroker({ questsFolderPath });

      fsWatchProxy.emitsChange({ filename: '.cli-signal' });

      const result = await resultPromise;

      expect(result).toStrictEqual({
        type: 'quest-complete',
        questId: 'abc-123',
      });
    });

    it('VALID: {questsFolderPath: "/quests"} => ignores non-signal files', async () => {
      const { fsWatchProxy, signalReadProxy } = signalWatchBrokerProxy();
      const questsFolderPath = FilePathStub({ value: '/quests' });
      const signalJson = JSON.stringify({ type: 'agent-ready' });

      signalReadProxy.fsReadFileProxy.resolves({ content: signalJson });
      signalReadProxy.fsUnlinkProxy.succeeds();

      const resultPromise = signalWatchBroker({ questsFolderPath });

      fsWatchProxy.emitsChange({ filename: 'other-file.json' });
      fsWatchProxy.emitsChange({ filename: 'quest-data.json' });
      fsWatchProxy.emitsChange({ filename: '.cli-signal' });

      const result = await resultPromise;

      expect(result).toStrictEqual({
        type: 'agent-ready',
      });
    });

    it('VALID: {questsFolderPath: "/quests"} => closes watcher after signal detected', async () => {
      const { fsWatchProxy, signalReadProxy } = signalWatchBrokerProxy();
      const questsFolderPath = FilePathStub({ value: '/quests' });
      const signalJson = JSON.stringify({ type: 'quest-complete' });

      signalReadProxy.fsReadFileProxy.resolves({ content: signalJson });
      signalReadProxy.fsUnlinkProxy.succeeds();

      const resultPromise = signalWatchBroker({ questsFolderPath });

      fsWatchProxy.emitsChange({ filename: '.cli-signal' });

      await resultPromise;

      expect(fsWatchProxy.wasClosed()).toBe(true);
    });
  });

  describe('error conditions', () => {
    it('ERROR: {questsFolderPath: "/quests"} => rejects when signal read fails', async () => {
      const { fsWatchProxy, signalReadProxy } = signalWatchBrokerProxy();
      const questsFolderPath = FilePathStub({ value: '/quests' });

      signalReadProxy.fsReadFileProxy.rejects({ error: new Error('Failed to read signal file') });

      const resultPromise = signalWatchBroker({ questsFolderPath });

      fsWatchProxy.emitsChange({ filename: '.cli-signal' });

      await expect(resultPromise).rejects.toThrow(/Failed to read/u);
    });
  });
});
