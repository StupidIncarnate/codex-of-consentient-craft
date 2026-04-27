import {
  claudeLineNormalizeBrokerProxy,
  locationsClaudeSessionFilePathFindBrokerProxy,
} from '@dungeonmaster/shared/testing';

import { fsReadJsonlAdapterProxy } from '../../../adapters/fs/read-jsonl/fs-read-jsonl-adapter.proxy';

export const signalFromSessionJsonlBrokerProxy = (): {
  setupFileContent: (params: { content: string }) => void;
  setupFileNotFound: () => void;
  setupReadError: (params: { error: Error }) => void;
} => {
  claudeLineNormalizeBrokerProxy();
  // Wires the locations broker chain (os.homedir + path.join). The broker's defaults produce
  // a deterministic path that's never actually touched, since fsReadJsonlAdapter (readFile) is
  // mocked below.
  locationsClaudeSessionFilePathFindBrokerProxy();
  const readJsonlProxy = fsReadJsonlAdapterProxy();

  return {
    setupFileContent: ({ content }: { content: string }): void => {
      readJsonlProxy.returns({ content });
    },
    setupFileNotFound: (): void => {
      const enoent = new Error('ENOENT: no such file or directory');
      Object.assign(enoent, { code: 'ENOENT' });
      readJsonlProxy.throws({ error: enoent });
    },
    setupReadError: ({ error }: { error: Error }): void => {
      readJsonlProxy.throws({ error });
    },
  };
};
