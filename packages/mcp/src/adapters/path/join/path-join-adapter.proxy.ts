import { join } from 'path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import type { PathSegment } from '@dungeonmaster/shared/contracts';

export const pathJoinAdapterProxy = (): {
  returns: ({ paths, result }: { paths: readonly string[]; result: PathSegment }) => void;
} => {
  const handle = registerMock({ fn: join });

  // Default: passthrough to the real path.join. Several callers build a real, usable path
  // through this adapter and never stage a specific answer — they rely on join actually
  // joining. A staged `calledWith` still wins over this fallback for the segments it names.
  const actualPath = requireActual<{ join: typeof join }>({ module: 'path' });
  handle
    .calledWith([])
    .implement(((...segments: unknown[]) =>
      actualPath.join(...(segments as Parameters<typeof join>))) as (...args: never[]) => unknown);

  return {
    // join's SEGMENTS are the address — the full argument list, in order.
    returns: ({ paths, result }: { paths: readonly string[]; result: PathSegment }): void => {
      handle.calledWith([...paths]).returns(result);
    },
  };
};
