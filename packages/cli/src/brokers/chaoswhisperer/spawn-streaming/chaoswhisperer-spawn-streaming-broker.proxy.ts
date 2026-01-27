import { cryptoRandomUuidAdapterProxy } from '../../../adapters/crypto/random-uuid/crypto-random-uuid-adapter.proxy';
import { childProcessSpawnStreamJsonAdapterProxy } from '../../../adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter.proxy';
import { teeOutputLayerBrokerProxy } from './tee-output-layer-broker.proxy';
import type { ExitCode } from '@dungeonmaster/shared/contracts';
import type { StreamJsonLine } from '../../../contracts/stream-json-line/stream-json-line-contract';
import type { UuidStub } from '../../../contracts/uuid/uuid.stub';

type Uuid = ReturnType<typeof UuidStub>;

export const chaoswhispererSpawnStreamingBrokerProxy = (): {
  setupUuid: (params: { uuid: Uuid }) => void;
  setupSuccessWithSignal: (params: {
    exitCode: ExitCode;
    lines: readonly StreamJsonLine[];
  }) => void;
  setupSuccessNoSignal: (params: { exitCode: ExitCode }) => void;
  setupError: (params: { error: Error }) => void;
  getSpawnedArgs: () => unknown;
} => {
  const uuidProxy = cryptoRandomUuidAdapterProxy();
  const spawnProxy = childProcessSpawnStreamJsonAdapterProxy();
  // Instantiate tee layer proxy to ensure readline mock is set up
  teeOutputLayerBrokerProxy();

  return {
    setupUuid: ({ uuid }: { uuid: Uuid }): void => {
      uuidProxy.setupReturns({ uuid });
    },

    setupSuccessWithSignal: ({
      exitCode,
      lines,
    }: {
      exitCode: ExitCode;
      lines: readonly StreamJsonLine[];
    }): void => {
      spawnProxy.setupSuccess({ exitCode, stdoutData: lines });
    },

    setupSuccessNoSignal: ({ exitCode }: { exitCode: ExitCode }): void => {
      spawnProxy.setupSuccess({ exitCode });
    },

    setupError: ({ error }: { error: Error }): void => {
      spawnProxy.setupError({ error });
    },

    getSpawnedArgs: (): unknown => spawnProxy.getSpawnedArgs(),
  };
};
