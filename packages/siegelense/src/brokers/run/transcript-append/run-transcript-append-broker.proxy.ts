import type { FsError } from '#gateway/node/fs';
import { appendFileProxy } from '#gateway/node/fs__promises/append-file/append-file.proxy';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const runTranscriptAppendBrokerProxy = (): {
  succeeds: (params: { transcriptPath: AbsoluteFilePath }) => void;
  throws: (params: { transcriptPath: AbsoluteFilePath; error: FsError }) => void;
  appendedLinesFor: (params: { transcriptPath: AbsoluteFilePath }) => readonly unknown[];
} => {
  const appendProxy = appendFileProxy();

  return {
    succeeds: ({ transcriptPath }: { transcriptPath: AbsoluteFilePath }): void => {
      appendProxy.succeeds({ path: transcriptPath });
    },

    throws: ({
      transcriptPath,
      error,
    }: {
      transcriptPath: AbsoluteFilePath;
      error: FsError;
    }): void => {
      appendProxy.rejects({ path: transcriptPath, error });
    },

    // Every line appended for this path, IN CALL ORDER — the proof a transcript is flushed per
    // step rather than buffered is that this list already holds N entries mid-run, not just at
    // the end.
    appendedLinesFor: ({
      transcriptPath,
    }: {
      transcriptPath: AbsoluteFilePath;
    }): readonly unknown[] =>
      appendProxy.getCallsFor({ path: transcriptPath }).map((call) => call[1]),
  };
};
