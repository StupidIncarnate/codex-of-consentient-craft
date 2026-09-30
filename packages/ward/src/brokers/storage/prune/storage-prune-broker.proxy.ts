import { readdirIfExistsProxy } from '#gateway/node/fs__promises/readdir-if-exists/readdir-if-exists.proxy';
import { statIfExistsProxy } from '#gateway/node/fs__promises/stat-if-exists/stat-if-exists.proxy';
import { unlinkProxy } from '#gateway/node/fs__promises/unlink/unlink.proxy';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

const TINY_FILE_BYTES = 1024;

export const storagePruneBrokerProxy = (): {
  setupWithFiles: (params: {
    rootPath: string;
    entries: string[];
    now: number;
    mtimes?: Record<string, number>;
    sizes?: Record<string, number>;
    statNullFor?: string[];
  }) => void;
  setupEmpty: (params: { rootPath: string }) => void;
  setupReaddirFail: (params: { rootPath: string }) => void;
  getDeletedPaths: () => unknown[];
} => {
  const readdirProxy = readdirIfExistsProxy();
  const statProxy = statIfExistsProxy();
  const unlink = unlinkProxy();

  const wardDirFor = ({ rootPath }: { rootPath: string }): string => `${rootPath}/.ward`;

  const runFilePathFor = ({ rootPath, name }: { rootPath: string; name: string }): string =>
    `${wardDirFor({ rootPath })}/${name}`;

  return {
    setupWithFiles: ({
      rootPath,
      entries,
      now,
      mtimes = {},
      sizes = {},
      statNullFor = [],
    }: {
      rootPath: string;
      entries: string[];
      now: number;
      mtimes?: Record<string, number>;
      sizes?: Record<string, number>;
      statNullFor?: string[];
    }): void => {
      registerSpyOn({ object: Date, method: 'now' }).calledWith([]).returns(now);
      readdirProxy.returns({ path: wardDirFor({ rootPath }), names: entries });

      // Every run file is stat'd for its size once it survives the TTL, so each entry gets a stat:
      // its staged mtime and size, else `now` and TINY_FILE_BYTES.
      for (const name of entries) {
        if (statNullFor.includes(name)) {
          statProxy.missing({ path: runFilePathFor({ rootPath, name }) });
        } else {
          statProxy.returnsFile({
            path: runFilePathFor({ rootPath, name }),
            sizeBytes: sizes[name] ?? TINY_FILE_BYTES,
            modifiedAtMs: mtimes[name] ?? now,
          });
        }
      }
      for (const name of entries) {
        unlink.succeeds({ path: runFilePathFor({ rootPath, name }) });
      }
    },
    setupEmpty: ({ rootPath }: { rootPath: string }): void => {
      readdirProxy.returns({ path: wardDirFor({ rootPath }), names: [] });
    },
    setupReaddirFail: ({ rootPath }: { rootPath: string }): void => {
      readdirProxy.missing({ path: wardDirFor({ rootPath }) });
    },
    getDeletedPaths: (): unknown[] =>
      unlink.getCallsFor({ path: () => true }).map((call) => call[0]),
  };
};
