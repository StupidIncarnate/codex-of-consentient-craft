import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { AbsoluteFilePathStub, FilePathStub } from '@dungeonmaster/shared/contracts';

import { errorIsNativeErrorAdapterProxy } from '../../../adapters/error/is-native-error/error-is-native-error-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

const VMSTAT_PATH = AbsoluteFilePathStub({ value: '/proc/vmstat' });

export const machineOomCountBrokerProxy = (): {
  setupVmstat: (params: { content: string }) => void;
  setupVmstatMissing: () => void;
  setupVmstatReadFails: (params: { error: Error }) => void;
} => {
  errorIsNativeErrorAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();

  // '/proc' + 'vmstat' needs no substitution to compute VMSTAT_PATH's real value, so this join is
  // ALSO explicitly staged (inside each scenario method, in the same call-ordered position a
  // composing proxy calls it) rather than left to the real-passthrough default: a composing proxy
  // (machineReadBrokerProxy, and anything built on top of it) queues its own pending path
  // resolutions on this same shared mock around when this join runs — an unstaged call here would
  // consume one of those instead of computing its own real path.
  const queueVmstatPathJoin = (): void => {
    pathJoinProxy.returns({ result: FilePathStub({ value: '/proc/vmstat' }) });
  };

  return {
    setupVmstat: ({ content }: { content: string }): void => {
      queueVmstatPathJoin();
      readFileProxy.resolves({ filePath: VMSTAT_PATH, content });
    },

    setupVmstatMissing: (): void => {
      queueVmstatPathJoin();
      readFileProxy.rejects({
        filePath: VMSTAT_PATH,
        error: Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' }),
      });
    },

    setupVmstatReadFails: ({ error }: { error: Error }): void => {
      queueVmstatPathJoin();
      readFileProxy.rejects({ filePath: VMSTAT_PATH, error });
    },
  };
};
