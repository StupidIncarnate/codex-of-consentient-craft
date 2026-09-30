import type { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

type FsError = ReturnType<typeof FsErrorStub>;

// No quest file path is known to `setupQuestFile`: every caller composes this proxy alongside a
// separate path-producing mock (a directory scan, questFindQuestPathBrokerProxy, ...) and stages
// the two in lockstep, one quest file at a time. Any path is accepted, and the fallback one-shot
// ranks below every exact stage, so a read another proxy addressed by its own path is never
// answered with quest JSON.
const isAnyPath = (value: unknown): boolean => typeof value === 'string';

export const questLoadBrokerProxy = (): {
  setupQuestFile: (params: { questJson: string }) => void;
  setupQuestFileReadError: (params: { error: FsError }) => void;
  setupQuestFileAt: (params: { questFilePath: string; questJson: string }) => void;
} => {
  const readFileChild = readFileProxy();

  return {
    setupQuestFile: ({ questJson }: { questJson: string }): void => {
      readFileChild.returnsOnceFallback({ path: isAnyPath, contents: questJson });
    },
    setupQuestFileReadError: ({ error }: { error: FsError }): void => {
      readFileChild.throwsOnceFallback({ path: isAnyPath, error });
    },
    // Sticky and addressed: answers EVERY read of this one path, for a caller whose broker reads the
    // same quest file several times in one call (a scan, then again inside the modify lock).
    setupQuestFileAt: ({
      questFilePath,
      questJson,
    }: {
      questFilePath: string;
      questJson: string;
    }): void => {
      readFileChild.returns({ path: questFilePath, contents: questJson });
    },
  };
};
