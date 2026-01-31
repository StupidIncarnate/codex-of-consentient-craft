import { cryptoRandomUuidAdapterProxy } from '../../../adapters/crypto/random-uuid/crypto-random-uuid-adapter.proxy';
import { childProcessSpawnStreamJsonAdapterProxy } from '../../../adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter.proxy';
import { teeOutputLayerBrokerProxy } from './tee-output-layer-broker.proxy';
import { StreamTextStub } from '../../../contracts/stream-text/stream-text.stub';
import type { ExitCode } from '@dungeonmaster/shared/contracts';
import type { StreamJsonLine } from '../../../contracts/stream-json-line/stream-json-line-contract';
import type { UuidStub } from '../../../contracts/uuid/uuid.stub';
import type { PromptTextStub } from '../../../contracts/prompt-text/prompt-text.stub';

type Uuid = ReturnType<typeof UuidStub>;
type PromptText = ReturnType<typeof PromptTextStub>;
type StreamText = ReturnType<typeof StreamTextStub>;

export const chaoswhispererSpawnStreamingBrokerProxy = (): {
  setupUuid: (params: { uuid: Uuid }) => void;
  setupSuccessWithSignal: (params: {
    exitCode: ExitCode;
    lines: readonly StreamJsonLine[];
  }) => void;
  setupSuccessNoSignal: (params: { exitCode: ExitCode }) => void;
  setupError: (params: { error: Error }) => void;
  getSpawnedArgs: () => unknown;
  getSpawnedPrompt: () => PromptText | undefined;
  getStderrOutput: () => StreamText;
} => {
  const uuidProxy = cryptoRandomUuidAdapterProxy();
  const spawnProxy = childProcessSpawnStreamJsonAdapterProxy();
  // Instantiate tee layer proxy to ensure readline mock is set up
  teeOutputLayerBrokerProxy();

  // Capture stderr output via spy
  const stderrChunks: unknown[] = [];
  jest.spyOn(process.stderr, 'write').mockImplementation((chunk: unknown) => {
    stderrChunks.push(chunk);
    return true;
  });

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

    getSpawnedPrompt: (): PromptText | undefined => {
      const args = spawnProxy.getSpawnedArgs() as readonly PromptText[] | undefined;
      if (!args) return undefined;
      // Prompt is at index 1 (after '-p' flag at index 0)
      return args[1];
    },

    getStderrOutput: (): StreamText => {
      const combined = stderrChunks.map((c) => String(c)).join('');
      return StreamTextStub({ value: combined });
    },
  };
};
