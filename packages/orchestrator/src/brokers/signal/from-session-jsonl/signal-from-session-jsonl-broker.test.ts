import { AbsoluteFilePathStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { signalFromSessionJsonlBroker } from './signal-from-session-jsonl-broker';
import { signalFromSessionJsonlBrokerProxy } from './signal-from-session-jsonl-broker.proxy';

const GUILD_PATH = AbsoluteFilePathStub({ value: '/home/user/repo' });
const SESSION_ID = SessionIdStub({ value: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' });

const signalLineCompleteAllDone = JSON.stringify({
  type: 'assistant',
  message: {
    content: [
      {
        type: 'tool_use',
        name: 'mcp__dungeonmaster__signal-back',
        input: { signal: 'complete', summary: 'All done' },
      },
    ],
  },
});

const signalLineFailedFirst = JSON.stringify({
  type: 'assistant',
  message: {
    content: [
      {
        type: 'tool_use',
        name: 'mcp__dungeonmaster__signal-back',
        input: { signal: 'failed', summary: 'first attempt' },
      },
    ],
  },
});

const signalLineCompleteSecond = JSON.stringify({
  type: 'assistant',
  message: {
    content: [
      {
        type: 'tool_use',
        name: 'mcp__dungeonmaster__signal-back',
        input: { signal: 'complete', summary: 'second attempt' },
      },
    ],
  },
});

const signalLineCompleteOk = JSON.stringify({
  type: 'assistant',
  message: {
    content: [
      {
        type: 'tool_use',
        name: 'mcp__dungeonmaster__signal-back',
        input: { signal: 'complete', summary: 'ok' },
      },
    ],
  },
});

const nonSignalAssistantLine = JSON.stringify({
  type: 'assistant',
  message: {
    content: [{ type: 'text', text: 'just thinking out loud' }],
  },
});

describe('signalFromSessionJsonlBroker', () => {
  describe('signal extraction', () => {
    it('VALID: {file with one signal-back line} => returns that signal', async () => {
      const proxy = signalFromSessionJsonlBrokerProxy();
      proxy.setupFileContent({ content: `${signalLineCompleteAllDone}\n` });

      const result = await signalFromSessionJsonlBroker({
        guildPath: GUILD_PATH,
        sessionId: SESSION_ID,
      });

      expect(result).toStrictEqual({ signal: 'complete', summary: 'All done' });
    });

    it('VALID: {file with multiple signal-back lines} => returns LAST signal (last wins)', async () => {
      const proxy = signalFromSessionJsonlBrokerProxy();
      proxy.setupFileContent({
        content: [signalLineFailedFirst, nonSignalAssistantLine, signalLineCompleteSecond].join(
          '\n',
        ),
      });

      const result = await signalFromSessionJsonlBroker({
        guildPath: GUILD_PATH,
        sessionId: SESSION_ID,
      });

      expect(result).toStrictEqual({ signal: 'complete', summary: 'second attempt' });
    });

    it('EMPTY: {file with no signal-back lines} => returns null', async () => {
      const proxy = signalFromSessionJsonlBrokerProxy();
      proxy.setupFileContent({
        content: `${nonSignalAssistantLine}\n${nonSignalAssistantLine}\n`,
      });

      const result = await signalFromSessionJsonlBroker({
        guildPath: GUILD_PATH,
        sessionId: SESSION_ID,
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {empty file} => returns null', async () => {
      const proxy = signalFromSessionJsonlBrokerProxy();
      proxy.setupFileContent({ content: '' });

      const result = await signalFromSessionJsonlBroker({
        guildPath: GUILD_PATH,
        sessionId: SESSION_ID,
      });

      expect(result).toBe(null);
    });
  });

  describe('file does not exist', () => {
    it('EMPTY: {file does not exist (ENOENT)} => returns null', async () => {
      const proxy = signalFromSessionJsonlBrokerProxy();
      proxy.setupFileNotFound();

      const result = await signalFromSessionJsonlBroker({
        guildPath: GUILD_PATH,
        sessionId: SESSION_ID,
      });

      expect(result).toBe(null);
    });
  });

  describe('non-ENOENT read errors', () => {
    it('ERROR: {file read fails with non-ENOENT error} => rethrows the error', async () => {
      const proxy = signalFromSessionJsonlBrokerProxy();
      const ioError = new Error('EACCES: permission denied');
      Object.assign(ioError, { code: 'EACCES' });
      proxy.setupReadError({ error: ioError });

      await expect(
        signalFromSessionJsonlBroker({ guildPath: GUILD_PATH, sessionId: SESSION_ID }),
      ).rejects.toThrow(/EACCES/u);
    });
  });

  describe('malformed lines', () => {
    it('VALID: {file with malformed JSON line mixed with valid signal} => skips bad line, returns signal', async () => {
      const proxy = signalFromSessionJsonlBrokerProxy();
      proxy.setupFileContent({
        content: ['{not valid json', signalLineCompleteOk].join('\n'),
      });

      const result = await signalFromSessionJsonlBroker({
        guildPath: GUILD_PATH,
        sessionId: SESSION_ID,
      });

      expect(result).toStrictEqual({ signal: 'complete', summary: 'ok' });
    });
  });
});
