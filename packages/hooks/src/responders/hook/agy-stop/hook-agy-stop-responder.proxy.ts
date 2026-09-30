import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

export const HookAgyStopResponderProxy = (): {
  setupTranscript: (params: { filePath: string; contents: string }) => void;
  setupReadError: (params: { filePath: string }) => void;
} => {
  const readProxy = readFileProxy();

  return {
    setupTranscript: ({ filePath, contents }: { filePath: string; contents: string }): void => {
      readProxy.returns({ path: filePath, contents });
    },
    setupReadError: ({ filePath }: { filePath: string }): void => {
      readProxy.throwsMatchingPath({
        path: filePath,
        error: Object.assign(new Error('read failed'), { code: 'EACCES' }),
      });
    },
  };
};
