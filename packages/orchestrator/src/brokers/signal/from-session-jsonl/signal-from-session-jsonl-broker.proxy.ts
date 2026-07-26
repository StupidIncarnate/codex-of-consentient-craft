import {
  claudeLineNormalizeBrokerProxy,
  locationsClaudeSessionFilePathFindBrokerProxy,
} from '@dungeonmaster/shared/testing';
import { locationsClaudeSessionFilePathFindBroker } from '@dungeonmaster/shared/brokers';
import { AbsoluteFilePathStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { fsReadJsonlAdapterProxy } from '../../../adapters/fs/read-jsonl/fs-read-jsonl-adapter.proxy';

export const signalFromSessionJsonlBrokerProxy = (): {
  setupFileContent: (params: { content: string }) => void;
  setupFileNotFound: () => void;
  setupReadError: (params: { error: Error }) => void;
} => {
  claudeLineNormalizeBrokerProxy();
  // Wires the locations broker chain (os.homedir + path.join) but leaves it unstaged — its
  // real defaults (osUserHomedirAdapter's mocked '/home/default' + a real path.join
  // passthrough) are exactly what the broker itself resolves through at runtime.
  locationsClaudeSessionFilePathFindBrokerProxy();
  const readJsonlProxy = fsReadJsonlAdapterProxy();

  // Every test in signal-from-session-jsonl-broker.test.ts calls the broker with these same
  // GUILD_PATH/SESSION_ID constants. Computed via the REAL (unmocked) broker function — same
  // homedir/path.join defaults the code under test resolves through — so this address can
  // never drift from what fsReadJsonlAdapter is actually called with.
  const filePath = locationsClaudeSessionFilePathFindBroker({
    guildPath: AbsoluteFilePathStub({ value: '/home/user/repo' }),
    sessionId: SessionIdStub({ value: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' }),
  });

  return {
    setupFileContent: ({ content }: { content: string }): void => {
      readJsonlProxy.returns({ filePath, content });
    },
    setupFileNotFound: (): void => {
      const enoent = new Error('ENOENT: no such file or directory');
      Object.assign(enoent, { code: 'ENOENT' });
      readJsonlProxy.throws({ filePath, error: enoent });
    },
    setupReadError: ({ error }: { error: Error }): void => {
      readJsonlProxy.throws({ filePath, error });
    },
  };
};
