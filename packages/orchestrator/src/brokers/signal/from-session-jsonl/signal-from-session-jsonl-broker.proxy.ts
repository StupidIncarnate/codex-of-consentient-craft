import type { FsError } from '#gateway/node/fs';
import { isFsErrorProxy } from '#gateway/node/fs/is-fs-error/is-fs-error.proxy';
import { readNonEmptyLinesProxy } from '#gateway/node/fs__promises/read-non-empty-lines/read-non-empty-lines.proxy';
import { claudeLineNormalizeBrokerProxy } from '@dungeonmaster/shared/brokers/claude-line/normalize/claude-line-normalize-broker.proxy';
import { locationsClaudeSessionFilePathFindBrokerProxy } from '@dungeonmaster/shared/brokers/locations/claude-session-file-path-find/locations-claude-session-file-path-find-broker.proxy';
import { locationsClaudeSessionFilePathFindBroker } from '@dungeonmaster/shared/brokers';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts/absolute-file-path/absolute-file-path.stub';
import { SessionIdStub } from '@dungeonmaster/shared/contracts/session-id/session-id.stub';

export const signalFromSessionJsonlBrokerProxy = (): {
  setupFileContent: (params: { content: string }) => void;
  setupFileNotFound: () => void;
  setupReadError: (params: { error: FsError }) => void;
} => {
  claudeLineNormalizeBrokerProxy();
  // Wires the locations broker chain (os.homedir + path.join) but leaves it unstaged — its
  // real defaults (osUserHomedirAdapter's mocked '/home/default' + a real path.join
  // passthrough) are exactly what the broker itself resolves through at runtime.
  locationsClaudeSessionFilePathFindBrokerProxy();
  isFsErrorProxy();
  const readLinesProxy = readNonEmptyLinesProxy();

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
      readLinesProxy.returnsRaw({ path: String(filePath), rawContents: content });
    },
    setupFileNotFound: (): void => {
      readLinesProxy.missing({ path: String(filePath) });
    },
    setupReadError: ({ error }: { error: FsError }): void => {
      readLinesProxy.throwsMatchingPath({ path: String(filePath), error });
    },
  };
};
