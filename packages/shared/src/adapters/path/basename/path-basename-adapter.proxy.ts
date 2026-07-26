import { basename } from 'path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import type { PathSegment } from '../../../contracts/path-segment/path-segment-contract';

export const pathBasenameAdapterProxy = (): {
  returns: ({ result }: { result: PathSegment }) => void;
} => {
  // Mock the npm package, not the adapter
  const handle = registerMock({ fn: basename });

  // Default mock behavior - delegate to the real node:path basename so tests
  // verify actual basename semantics (e.g. trailing-slash stripping). No shared broker
  // composes this adapter today (only its own colocated test), so this stays call-order
  // scoped (`onceFor([])`) rather than segment-keyed — consistent with its join/dirname
  // siblings, which face the same composed-path problem: the segment they would key on is
  // itself the output of another mocked call, so there is no fixed argument to address.
  const realPath = requireActual<{ basename: typeof basename }>({ module: 'path' });
  handle.calledWith([]).implement((inputPath: never) => realPath.basename(inputPath));

  return {
    // Semantic method for overriding the return value
    returns: ({ result }: { result: PathSegment }): void => {
      handle.onceFor([]).returns(result);
    },
  };
};
