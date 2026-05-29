import { basename } from 'path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import type { PathSegment } from '../../../contracts/path-segment/path-segment-contract';

export const pathBasenameAdapterProxy = (): {
  returns: ({ result }: { result: PathSegment }) => void;
} => {
  // Mock the npm package, not the adapter
  const handle = registerMock({ fn: basename });

  // Default mock behavior - delegate to the real node:path basename so tests
  // verify actual basename semantics (e.g. trailing-slash stripping)
  const realPath = requireActual<{ basename: typeof basename }>({ module: 'path' });
  handle.mockImplementation((inputPath: string) => realPath.basename(inputPath));

  return {
    // Semantic method for overriding the return value
    returns: ({ result }: { result: PathSegment }) => {
      handle.mockReturnValueOnce(result);
    },
  };
};
