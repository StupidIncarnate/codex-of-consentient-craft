import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { fsAppendFileAdapterProxy } from '../../../adapters/fs/append-file/fs-append-file-adapter.proxy';

export const runTranscriptAppendBrokerProxy = (): {
  succeeds: (params: { transcriptPath: AbsoluteFilePath }) => void;
  throws: (params: { transcriptPath: AbsoluteFilePath; error: Error }) => void;
  appendedLinesFor: (params: { transcriptPath: AbsoluteFilePath }) => readonly unknown[];
} => {
  const appendProxy = fsAppendFileAdapterProxy();

  return {
    succeeds: ({ transcriptPath }: { transcriptPath: AbsoluteFilePath }): void => {
      appendProxy.succeeds({ filePath: transcriptPath });
    },

    throws: ({
      transcriptPath,
      error,
    }: {
      transcriptPath: AbsoluteFilePath;
      error: Error;
    }): void => {
      appendProxy.throws({ filePath: transcriptPath, error });
    },

    // Every line appended for this path, IN CALL ORDER — the proof a transcript is flushed per
    // step rather than buffered is that this list already holds N entries mid-run, not just at
    // the end.
    appendedLinesFor: ({
      transcriptPath,
    }: {
      transcriptPath: AbsoluteFilePath;
    }): readonly unknown[] => appendProxy.getAppendedFor({ filePath: transcriptPath }),
  };
};
