import { signalCliReturnBroker } from './signal-cli-return-broker';
import { signalCliReturnBrokerProxy } from './signal-cli-return-broker.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import type { CliSignalStub } from '../../../contracts/cli-signal/cli-signal.stub';

type CliSignal = ReturnType<typeof CliSignalStub>;

describe('signalCliReturnBroker', () => {
  describe('successful signal', () => {
    it('VALID: {screen: "list"} => writes signal file with list screen', async () => {
      const proxy = signalCliReturnBrokerProxy();
      const questsFolder = FilePathStub({ value: '/project/.dungeonmaster-quests' });
      const signalPath = FilePathStub({ value: '/project/.dungeonmaster-quests/.cli-signal' });

      proxy.setupSignalWrite({ questsFolder, signalPath });

      const result = await signalCliReturnBroker({ screen: 'list' });

      expect(result).toStrictEqual({
        success: true,
        signalPath: '/project/.dungeonmaster-quests/.cli-signal',
      });
    });

    it('VALID: {screen: "menu"} => writes signal file with menu screen', async () => {
      const proxy = signalCliReturnBrokerProxy();
      const questsFolder = FilePathStub({ value: '/project/.dungeonmaster-quests' });
      const signalPath = FilePathStub({ value: '/project/.dungeonmaster-quests/.cli-signal' });

      proxy.setupSignalWrite({ questsFolder, signalPath });

      const result = await signalCliReturnBroker({ screen: 'menu' });

      expect(result).toStrictEqual({
        success: true,
        signalPath: '/project/.dungeonmaster-quests/.cli-signal',
      });
    });

    it('VALID: {no screen} => defaults to list screen', async () => {
      const proxy = signalCliReturnBrokerProxy();
      const questsFolder = FilePathStub({ value: '/project/.dungeonmaster-quests' });
      const signalPath = FilePathStub({ value: '/project/.dungeonmaster-quests/.cli-signal' });

      proxy.setupSignalWrite({ questsFolder, signalPath });

      const result = await signalCliReturnBroker({});

      expect(result).toStrictEqual({
        success: true,
        signalPath: '/project/.dungeonmaster-quests/.cli-signal',
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {write fails} => throws error', async () => {
      const proxy = signalCliReturnBrokerProxy();

      proxy.setupWriteFails({ error: new Error('Permission denied') });

      await expect(signalCliReturnBroker({ screen: 'list' })).rejects.toThrow(/Permission denied/u);
    });
  });

  describe('signal file content', () => {
    it('VALID: {screen: "list"} => signal file contains correct JSON structure', async () => {
      const proxy = signalCliReturnBrokerProxy();
      const writtenContent = proxy.setupWriteAndCapture();

      await signalCliReturnBroker({ screen: 'list' });

      const parsed = JSON.parse(writtenContent()) as CliSignal;

      expect(parsed.action).toBe('return');
      expect(parsed.screen).toBe('list');
      expect(typeof parsed.timestamp).toBe('string');
    });

    it('VALID: {screen: "menu"} => signal file contains menu screen', async () => {
      const proxy = signalCliReturnBrokerProxy();
      const writtenContent = proxy.setupWriteAndCapture();

      await signalCliReturnBroker({ screen: 'menu' });

      const parsed = JSON.parse(writtenContent()) as CliSignal;

      expect(parsed.action).toBe('return');
      expect(parsed.screen).toBe('menu');
    });
  });
});
