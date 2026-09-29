import { dirname, join } from '#gateway/node/path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { locationsStatics } from '../../../statics/locations/locations-statics';

type FilePath = ReturnType<typeof FilePathStub>;

export const guildPathWalkUpLayerBrokerProxy = (): {
  setupGuildFoundAtStart: (params: { startPath: string }) => void;
  setupGuildFoundInParent: (params: { startPath: string; guildPath: string }) => void;
  setupGuildNotFound: (params: { startPath: string }) => void;
} => {
  const pathExistsHandle = pathExistsProxy();

  // join/dirname are pure and carry no gateway proxy of their own (#gateway/node/path is a raw
  // passthrough), so they are mocked directly here — but the mock MUST be registered on `join`/
  // `dirname` as imported from '#gateway/node/path' (the same specifier the broker imports),
  // never from raw 'path'. Jest's module registry keys a mock by resolved module file, and
  // #gateway/node/path's compiled `export = require('path')` captures its own reference to the
  // real 'path' module at that file's own load time — mocking raw 'path' from a DIFFERENT file
  // does not reach that already-captured reference, so the broker's calls would silently see the
  // real function while every stage here goes unused (see config-root-find-broker.proxy.ts,
  // which hit exactly this composing through a sibling package's still-unmigrated proxy).
  // The REAL values still come from requireActual, never the (possibly mocked) import above.
  // Each call is staged on a SPECIFIC argument tuple, never a bare `calledWith([])`: a bare
  // zero-arg address is an order-dependent queue that a not-yet-migrated sibling proxy's own
  // join()/dirname() staging (still on raw 'path', a separate mock target from this one) can
  // consume out of turn — a specific address is matched on its own arguments and never touches
  // that queue.
  const realPath = requireActual<{ join: typeof join; dirname: typeof dirname }>({
    module: 'path',
  });
  const joinHandle = registerMock({ fn: join });
  const dirnameHandle = registerMock({ fn: dirname });
  // Sticky real-passthrough default for every OTHER join call this test never describes.
  joinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));

  const guildConfigPathFor = ({ dirPath }: { dirPath: string }): FilePath => {
    const { guildConfigFile } = locationsStatics.dungeonmasterHome;
    const guildConfigPath = FilePathStub({ value: realPath.join(dirPath, guildConfigFile) });
    joinHandle.calledWith([dirPath, guildConfigFile]).returns(guildConfigPath);
    return guildConfigPath;
  };

  const dirnameFor = ({ dirPath }: { dirPath: string }): FilePath => {
    const parent = FilePathStub({ value: realPath.dirname(dirPath) });
    dirnameHandle.calledWith([dirPath]).returns(parent);
    return parent;
  };

  // Recursive, not a loop: the real walk visits every ancestor directory one at a time, so
  // every level needs its own staged "missing" answer up to (but not including) stopAt — or
  // all the way to the filesystem root when stopAt is omitted. The object literal below omits
  // `stopAt` rather than passing it as `undefined` (exactOptionalPropertyTypes).
  const stageMissingUntil = ({ dirPath, stopAt }: { dirPath: string; stopAt?: string }): void => {
    if (stopAt !== undefined && dirPath === stopAt) {
      return;
    }
    pathExistsHandle.missing({ path: guildConfigPathFor({ dirPath }) });
    const parent = dirnameFor({ dirPath });
    if (parent === dirPath) {
      return;
    }
    stageMissingUntil(stopAt === undefined ? { dirPath: parent } : { dirPath: parent, stopAt });
  };

  return {
    setupGuildFoundAtStart: ({ startPath }: { startPath: string }): void => {
      pathExistsHandle.present({ path: guildConfigPathFor({ dirPath: startPath }) });
    },

    setupGuildFoundInParent: ({
      startPath,
      guildPath,
    }: {
      startPath: string;
      guildPath: string;
    }): void => {
      stageMissingUntil({ dirPath: startPath, stopAt: guildPath });
      pathExistsHandle.present({ path: guildConfigPathFor({ dirPath: guildPath }) });
    },

    setupGuildNotFound: ({ startPath }: { startPath: string }): void => {
      stageMissingUntil({ dirPath: startPath });
    },
  };
};
