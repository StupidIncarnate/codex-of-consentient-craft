import type { FsError } from '#gateway/node/fs';
import { appendFileProxy } from '#gateway/node/fs__promises/append-file/append-file.proxy';

export const runTranscriptAppendBrokerProxy = (): {
  succeeds: (params: { transcriptPath: string }) => void;
  throws: (params: { transcriptPath: string; error: FsError }) => void;
  appendedLinesFor: (params: { transcriptPath: string }) => readonly unknown[];
} => {
  const appendProxy = appendFileProxy();

  return {
    succeeds: ({ transcriptPath }: { transcriptPath: string }): void => {
      appendProxy.succeeds({ path: transcriptPath });
    },

    throws: ({
      transcriptPath,
      error,
    }: {
      transcriptPath: string;
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
      transcriptPath: string;
    }): readonly unknown[] =>
      appendProxy.getCallsFor({ path: transcriptPath }).map((call) => call[1]),
  };
};
