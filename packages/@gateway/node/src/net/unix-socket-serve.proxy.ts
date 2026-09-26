import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';

// Real unix domain sockets (net isn't trapped) drive the colocated test's actual behaviour; the
// three real `fs` calls this wrapper makes internally (mkdir-before-listen, stale-socket unlink)
// are staged here as REAL passthroughs — not fabricated stand-ins — so the io-trap sees them as
// staged while the genuine mkdir/exists/unlink still happens against the test's own real tmpdir.
export const unixSocketServeProxy = (): Record<PropertyKey, never> => {
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
