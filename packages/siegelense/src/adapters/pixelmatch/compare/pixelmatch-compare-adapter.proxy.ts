import pixelmatch from 'pixelmatch';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';

export const pixelmatchCompareAdapterProxy = (): {
  getCalls: () => unknown[][];
} => {
  const handle = registerMock({ fn: pixelmatch });
  const realPixelmatch = requireActual<typeof pixelmatch>({ module: 'pixelmatch' });

  // Real passthrough by default: pixelmatch is a pure, deterministic function over its inputs, so
  // every test gets a genuinely computed diff count instead of one staged to prove only that the
  // adapter forwards a return value (the same reasoning path-join-adapter.proxy.ts gives for its
  // own real-passthrough default). `calledWith([])` is a catch-all, and every call is still
  // recorded, so `getCalls()` can assert the exact options object a test never staged. The spread
  // needs pixelmatch's own tuple type, not `never[]`: pixelmatch takes fixed positional
  // parameters rather than a rest parameter, so TypeScript must see the exact arity to allow it.
  handle
    .calledWith([])
    .implement((...args: Parameters<typeof pixelmatch>) => realPixelmatch(...args));

  return {
    getCalls: (): unknown[][] => [...handle.callsMatching([])],
  };
};
