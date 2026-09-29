import { readFileFromOffsetProxy } from '#gateway/node/fs__promises/read-file-from-offset/read-file-from-offset.proxy';
import { Buffer } from '#gateway/node/buffer';

export const foldBatchLayerBrokerProxy = (): {
  setupTranscript: (params: { path: string; contents: string; fromByte?: number }) => void;
  setupUnreadableTranscript: (params: { path: string }) => void;
} => {
  const offsetProxy = readFileFromOffsetProxy();

  return {
    // The wrapper's fake copies `contents` to the start of a buffer sized `size - fromByte`, so a
    // ranged read is staged as the whole file's size plus only the bytes from `fromByte` onward.
    setupTranscript: ({
      path,
      contents,
      fromByte = 0,
    }: {
      path: string;
      contents: string;
      fromByte?: number;
    }): void => {
      const whole = Buffer.from(contents, 'utf8');
      offsetProxy.returns({
        path,
        size: whole.length,
        contents: whole.subarray(fromByte).toString('utf8'),
      });
    },

    setupUnreadableTranscript: ({ path }: { path: string }): void => {
      offsetProxy.denied({ path });
    },
  };
};
