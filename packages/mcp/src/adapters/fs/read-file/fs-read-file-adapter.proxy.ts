import { readFile } from 'fs/promises';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import type { FileContents, PathSegment } from '@dungeonmaster/shared/contracts';

export const fsReadFileAdapterProxy = (): {
  returns: ({ contents }: { contents: FileContents }) => void;
  throws: ({ error }: { error: Error }) => void;
  returnsFor: ({ filepath, contents }: { filepath: PathSegment; contents: FileContents }) => void;
  throwsFor: ({ filepath, error }: { filepath: PathSegment; error: Error }) => void;
} => {
  const handle = registerMock({ fn: readFile });

  // Default: passthrough to real readFile so tests that read real files still work
  const actualFs = requireActual<{ readFile: typeof readFile }>({ module: 'fs/promises' });
  handle
    .calledWith([])
    .implement((async (path: unknown) =>
      actualFs.readFile(path as Parameters<typeof readFile>[0], 'utf-8')) as (
      ...args: never[]
    ) => unknown);

  return {
    // Queued answers, for callers whose read path is not knowable at staging time — e.g. a proxy
    // whose broker builds the path with a mocked pathJoinAdapter, or one that walks a directory
    // listing and reads whatever it finds. Those address their answers by call order.
    returns: ({ contents }: { contents: FileContents }): void => {
      handle.onceFor([]).resolves(contents);
    },
    throws: ({ error }: { error: Error }): void => {
      handle.onceFor([]).rejects(error);
    },

    // Argument-addressed answers. fsReadFileAdapter calls readFile(filepath, 'utf8') — the path
    // reaches the mock unchanged, so staging the path alone prefix-matches the call and leaves
    // the encoding unconstrained. Every caller reading that path gets the same answer, in any
    // order, however many times it reads.
    returnsFor: ({
      filepath,
      contents,
    }: {
      filepath: PathSegment;
      contents: FileContents;
    }): void => {
      handle.calledWith([filepath]).resolves(contents);
    },
    throwsFor: ({ filepath, error }: { filepath: PathSegment; error: Error }): void => {
      handle.calledWith([filepath]).rejects(error);
    },
  };
};
