import { childProcessSpawnCaptureAdapterProxy } from '@dungeonmaster/shared/testing';
import {
  AbsoluteFilePathStub,
  ErrorMessageStub,
  ExitCodeStub,
} from '@dungeonmaster/shared/contracts';

import { binResolveBrokerProxy } from '../../bin/resolve/bin-resolve-broker.proxy';
import { BinCommandStub } from '../../../contracts/bin-command/bin-command.stub';
import { checkCommandsStatics } from '../../../statics/check-commands/check-commands-statics';
import { fsGlobSyncAdapterProxy } from '../../../adapters/fs/glob-sync/fs-glob-sync-adapter.proxy';
import { fsReadJsonSyncAdapterProxy } from '../../../adapters/fs/read-json-sync/fs-read-json-sync-adapter.proxy';

export const checkRunTypecheckRefsBrokerProxy = (): {
  setupTscBOutput: (params: { output: string; exitCode?: number }) => void;
} => {
  const captureProxy = childProcessSpawnCaptureAdapterProxy();
  const binProxy = binResolveBrokerProxy();
  const globProxy = fsGlobSyncAdapterProxy();
  const jsonProxy = fsReadJsonSyncAdapterProxy();
  const emptyMessage = ErrorMessageStub({ value: '' });

  // Every test file exercising this broker spawns tsc from the same repo root ('/repo'), so the
  // resolved command address is computed once here rather than threaded through each caller.
  const command = String(
    binProxy.setupFound({
      cwd: AbsoluteFilePathStub({ value: '/repo' }),
      binName: BinCommandStub({ value: checkCommandsStatics.typecheckRefs.bin }),
    }),
  );
  // Every project folder gets its own tsconfig.json read and its own glob discovery, but
  // these tests only assert on the grouped tsc-output errors per package, not on which
  // folder's tsconfig/patterns produced which discoveredCount — so every path/pattern is
  // described with one predicate rather than one entry per project folder.
  jsonProxy.returnsForAnyPath({ content: '{"include":["src/**/*"]}' });
  globProxy.returnsForAnyPattern({ files: ['discovered.ts'] });

  return {
    setupTscBOutput: ({ output, exitCode = 0 }: { output: string; exitCode?: number }): void => {
      captureProxy.setupSuccess({
        command,
        exitCode: ExitCodeStub({ value: exitCode }),
        stdout: ErrorMessageStub({ value: output }),
        stderr: emptyMessage,
      });
    },
  };
};
