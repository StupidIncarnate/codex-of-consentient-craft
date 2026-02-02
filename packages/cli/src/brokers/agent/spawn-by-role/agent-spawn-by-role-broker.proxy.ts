import type { ExitCode } from '@dungeonmaster/shared/contracts';

import type { StreamJsonLine } from '../../../contracts/stream-json-line/stream-json-line-contract';
import { pathseekerSpawnStreamingBrokerProxy } from '../../pathseeker/spawn-streaming/pathseeker-spawn-streaming-broker.proxy';
import { agentSpawnStreamingBrokerProxy } from '../spawn-streaming/agent-spawn-streaming-broker.proxy';

export const agentSpawnByRoleBrokerProxy = (): {
  setupPathseekerSuccess: (params: { exitCode: ExitCode }) => void;
  setupPathseekerSuccessWithSignal: (params: {
    exitCode: ExitCode;
    lines: readonly StreamJsonLine[];
  }) => void;
  setupPathseekerCrash: (params: { exitCode: ExitCode }) => void;
  setupCodeweaverSuccess: (params: { exitCode: ExitCode }) => void;
  setupCodeweaverSuccessWithSignal: (params: {
    exitCode: ExitCode;
    lines: readonly StreamJsonLine[];
  }) => void;
  setupCodeweaverTimeout: () => void;
  setupCodeweaverCrash: (params: { exitCode: ExitCode }) => void;
  setupSpiritmenderSuccess: (params: { exitCode: ExitCode }) => void;
  setupSpiritmenderSuccessWithSignal: (params: {
    exitCode: ExitCode;
    lines: readonly StreamJsonLine[];
  }) => void;
  setupSpiritmenderError: (params: { error: Error }) => void;
  setupLawbringerSuccess: (params: { exitCode: ExitCode }) => void;
  setupLawbringerSuccessWithSignal: (params: {
    exitCode: ExitCode;
    lines: readonly StreamJsonLine[];
  }) => void;
  setupSiegemasterSuccess: (params: { exitCode: ExitCode }) => void;
  setupSiegemasterSuccessWithSignal: (params: {
    exitCode: ExitCode;
    lines: readonly StreamJsonLine[];
  }) => void;
} => {
  // Pathseeker still uses its own broker, other roles now go directly through agentSpawnStreamingBroker
  pathseekerSpawnStreamingBrokerProxy();
  const sharedProxy = agentSpawnStreamingBrokerProxy();

  return {
    setupPathseekerSuccess: ({ exitCode }: { exitCode: ExitCode }): void => {
      sharedProxy.setupSuccessNoSignal({ exitCode });
    },

    setupPathseekerSuccessWithSignal: ({
      exitCode,
      lines,
    }: {
      exitCode: ExitCode;
      lines: readonly StreamJsonLine[];
    }): void => {
      sharedProxy.setupSuccessWithSignal({ exitCode, lines });
    },

    setupPathseekerCrash: ({ exitCode }: { exitCode: ExitCode }): void => {
      sharedProxy.setupCrash({ exitCode });
    },

    setupCodeweaverSuccess: ({ exitCode }: { exitCode: ExitCode }): void => {
      sharedProxy.setupSuccessNoSignal({ exitCode });
    },

    setupCodeweaverSuccessWithSignal: ({
      exitCode,
      lines,
    }: {
      exitCode: ExitCode;
      lines: readonly StreamJsonLine[];
    }): void => {
      sharedProxy.setupSuccessWithSignal({ exitCode, lines });
    },

    setupCodeweaverTimeout: (): void => {
      sharedProxy.setupTimeout({ exitCode: null });
    },

    setupCodeweaverCrash: ({ exitCode }: { exitCode: ExitCode }): void => {
      sharedProxy.setupCrash({ exitCode });
    },

    setupSpiritmenderSuccess: ({ exitCode }: { exitCode: ExitCode }): void => {
      sharedProxy.setupSuccessNoSignal({ exitCode });
    },

    setupSpiritmenderSuccessWithSignal: ({
      exitCode,
      lines,
    }: {
      exitCode: ExitCode;
      lines: readonly StreamJsonLine[];
    }): void => {
      sharedProxy.setupSuccessWithSignal({ exitCode, lines });
    },

    setupSpiritmenderError: ({ error }: { error: Error }): void => {
      sharedProxy.setupError({ error });
    },

    setupLawbringerSuccess: ({ exitCode }: { exitCode: ExitCode }): void => {
      sharedProxy.setupSuccessNoSignal({ exitCode });
    },

    setupLawbringerSuccessWithSignal: ({
      exitCode,
      lines,
    }: {
      exitCode: ExitCode;
      lines: readonly StreamJsonLine[];
    }): void => {
      sharedProxy.setupSuccessWithSignal({ exitCode, lines });
    },

    setupSiegemasterSuccess: ({ exitCode }: { exitCode: ExitCode }): void => {
      sharedProxy.setupSuccessNoSignal({ exitCode });
    },

    setupSiegemasterSuccessWithSignal: ({
      exitCode,
      lines,
    }: {
      exitCode: ExitCode;
      lines: readonly StreamJsonLine[];
    }): void => {
      sharedProxy.setupSuccessWithSignal({ exitCode, lines });
    },
  };
};
