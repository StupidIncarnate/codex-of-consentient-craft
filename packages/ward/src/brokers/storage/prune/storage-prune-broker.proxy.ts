import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';
import { fsUnlinkAdapterProxy } from '../../../adapters/fs/unlink/fs-unlink-adapter.proxy';

export const storagePruneBrokerProxy = (): {
  setupWithFiles: (params: { entries: string[]; now: number }) => void;
  setupEmpty: () => void;
  setupReaddirFail: (params: { error: Error }) => void;
} => {
  const readdirProxy = fsReaddirAdapterProxy();
  fsUnlinkAdapterProxy();

  return {
    setupWithFiles: ({ entries, now }: { entries: string[]; now: number }): void => {
      jest.spyOn(Date, 'now').mockReturnValue(now);
      readdirProxy.returns({ entries });
    },
    setupEmpty: (): void => {
      readdirProxy.returns({ entries: [] });
    },
    setupReaddirFail: ({ error }: { error: Error }): void => {
      readdirProxy.throws({ error });
    },
  };
};
