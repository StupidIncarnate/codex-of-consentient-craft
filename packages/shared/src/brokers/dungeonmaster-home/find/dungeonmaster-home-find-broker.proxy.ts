import { homedir } from '#gateway/node/os';
import { join } from '#gateway/node/path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import { locationsStatics } from '../../../statics/locations/locations-statics';

export const dungeonmasterHomeFindBrokerProxy = (): {
  setupHomePath: (params: { homeDir: string; homePath: FilePath }) => void;
  setHomeEnv: (params: { value: string }) => void;
  clearHomeEnv: () => void;
} => {
  // #gateway/node/os and #gateway/node/path are raw passthroughs of the Node 'os'/'path'
  // modules (no per-function wrapper, so no gateway proxy to compose) — mocked directly here.
  // `homedir`/`join` MUST be imported (above) from the same '#gateway/node/os'/'#gateway/node/path'
  // specifiers the broker imports, never raw 'os'/'path': Jest's module registry keys a mock by
  // resolved module file, and the gateway file's compiled `export = require(...)` captures its
  // own reference to the real module at ITS OWN load time — mocking the raw specifier from a
  // different file never reaches that already-captured reference, so the broker's calls would
  // silently see the real function while every stage here goes unused.
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  const homedirHandle = registerMock({ fn: homedir });
  const joinHandle = registerMock({ fn: join });
  // Sticky real-passthrough default for every OTHER join() call this test never describes.
  joinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));

  return {
    setupHomePath: ({ homeDir, homePath }: { homeDir: string; homePath: FilePath }): void => {
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');
      homedirHandle.calledWith([]).returns(homeDir);
      // Specific address (homeDir, dir name), never a bare `calledWith([])`: a bare zero-arg
      // stage would sit in the SAME order-dependent queue a not-yet-migrated sibling proxy's
      // own join() staging shares, and get consumed by whichever call happens first (the
      // "sticky default vs one-shot queue" collision the testing-patterns doc names for
      // path.join). A specific address is matched on its own arguments and never touches it.
      joinHandle.calledWith([homeDir, locationsStatics.dungeonmasterHome.dir]).returns(homePath);
    },
    setHomeEnv: ({ value }: { value: string }): void => {
      process.env.DUNGEONMASTER_HOME = value;
    },
    clearHomeEnv: (): void => {
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');
    },
  };
};
