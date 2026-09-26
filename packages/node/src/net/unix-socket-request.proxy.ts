import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';

// Real unix domain sockets (net isn't trapped) drive the colocated test's actual behaviour. This
// test file also spins up its own peer via `unixSocketServe` to talk to, and THAT function's
// internal real `fs` calls (mkdir-before-listen, stale-socket unlink) need staging too — as REAL
// passthroughs, not fabricated stand-ins, since the test needs the genuine mkdir/unlink to have
// happened for the real socket bind to work.
export const unixSocketRequestProxy = (): Record<PropertyKey, never> => {
  const realFs = requireActual<{
    existsSync: typeof existsSync;
    mkdirSync: typeof mkdirSync;
    unlinkSync: typeof unlinkSync;
  }>({ module: 'fs' });

  registerMock({ fn: mkdirSync })
    .calledWith([])
    .implement((...args: Parameters<typeof mkdirSync>) => realFs.mkdirSync(...args));
  registerMock({ fn: existsSync })
    .calledWith([])
    .implement((...args: Parameters<typeof existsSync>) => realFs.existsSync(...args));
  registerMock({ fn: unlinkSync })
    .calledWith([])
    .implement((...args: Parameters<typeof unlinkSync>) => {
      realFs.unlinkSync(...args);
    });

  return {};
};
