import { fsMkdirAdapterProxy, pathResolveAdapterProxy } from '@dungeonmaster/shared/testing';

export const guildDirectoryEnsureBrokerProxy = (): {
  pathsTouched: () => readonly unknown[];
} => {
  // fsMkdirAdapterProxy's own default (any unaddressed call succeeds) is all this broker needs —
  // composed bare, with no per-call staging, exactly as guildWriteRouteBroker's own proxy did
  // before this broker existed.
  const mkdirProxy = fsMkdirAdapterProxy();
  // pathResolveAdapterProxy's own default is a REAL passthrough, so the fencing check computes a
  // genuine resolved path with nothing staged.
  pathResolveAdapterProxy();

  return {
    // Every filesystem path this broker reached — the one directory it makes, and nothing else.
    pathsTouched: (): readonly unknown[] => mkdirProxy.getCreatedDirs(),
  };
};
