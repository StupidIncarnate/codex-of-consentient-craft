import { join } from 'path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const pathJoinAdapterProxy = (): {
  returns: ({ result }: { result: FilePath }) => void;
} => {
  // Mock the npm package, not the adapter
  const handle = registerMock({ fn: join });

  // THE JOIN/DIRNAME/BASENAME TRAP (see tmp/sweep-guidance.md): ~30 composing broker
  // proxies across packages/shared build a real path through this adapter and were never
  // given an address to key on individually within this pass — threading `segments` through
  // every one of them is a much larger ripple than converting this file. Instead of a naive
  // stand-in default, the base default is a REAL passthrough via requireActual, so any call
  // nobody explicitly staged still gets a genuine joined path instead of '' or a fabricated
  // value. `returns()` stays call-order-scoped (`onceFor([])`) to preserve today's behavior
  // for every existing caller — a live one-shot still outranks the sticky real-passthrough
  // default, so explicit staging keeps working exactly as before.
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  handle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));

  return {
    // Semantic method for setting return value
    returns: ({ result }: { result: FilePath }): void => {
      handle.onceFor([]).returns(result);
    },
  };
};
