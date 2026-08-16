import { readFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FileContents, PathSegment } from '@dungeonmaster/shared/contracts';

export const fsReadFileIfExistsAdapterProxy = (): {
  returnsFor: (params: { filepath: PathSegment; contents: FileContents }) => void;
  missingFor: (params: { filepath: PathSegment }) => void;
} => {
  // Every answer here is PATH-addressed, deliberately. `readFile` is also mocked by
  // fsReadFileAdapterProxy, whose constructor stages a `calledWith([])` passthrough; a second
  // catch-all at that same specificity would collide with it and the later construction would
  // silently win for every caller.
  const handle = registerMock({ fn: readFile });

  return {
    returnsFor: ({
      filepath,
      contents,
    }: {
      filepath: PathSegment;
      contents: FileContents;
    }): void => {
      handle.calledWith([filepath]).resolves(contents);
    },

    missingFor: ({ filepath }: { filepath: PathSegment }): void => {
      handle.calledWith([filepath]).rejects(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
    },
  };
};
