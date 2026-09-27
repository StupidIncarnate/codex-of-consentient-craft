import { join } from '#gateway/node/path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';

// homePath and ordinal arrive fully resolved as parameters, and the composed paths run through
// the real, deterministic `join` — there is nothing to stage beyond the real passthrough default.
// #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper, so
// no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path' specifier
// the broker imports. The default answers every join call with the REAL computed result, so a
// parent proxy composing this one alongside its own join calls is never answered by a fabricated
// fixed value it never asked for.
export const locationsSnapshotPathsFindBrokerProxy = (): Record<PropertyKey, never> => {
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  registerMock({ fn: join })
    .calledWith([])
    .implement((...segments: never[]) => realPath.join(...segments));

  return {};
};
