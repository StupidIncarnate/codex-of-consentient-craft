import { join } from '#gateway/node/path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';

// shotsDir and step arrive fully resolved as parameters, and the composed path runs through the
// real, deterministic `join` — there is nothing to stage beyond the real passthrough default.
// #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper, so
// no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path' specifier
// the broker imports.
export const locationsShotPathFindBrokerProxy = (): Record<PropertyKey, never> => {
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  registerMock({ fn: join })
    .calledWith([])
    .implement((...segments: never[]) => realPath.join(...segments));

  return {};
};
