import type { ExitCode } from '@dungeonmaster/shared/contracts';

import type { StreamJsonLine } from '../../../contracts/stream-json-line/stream-json-line-contract';
import { codeweaverSpawnStreamingBrokerProxy } from '../../codeweaver/spawn-streaming/codeweaver-spawn-streaming-broker.proxy';
import { lawbringerSpawnStreamingBrokerProxy } from '../../lawbringer/spawn-streaming/lawbringer-spawn-streaming-broker.proxy';
import { pathseekerSpawnStreamingBrokerProxy } from '../../pathseeker/spawn-streaming/pathseeker-spawn-streaming-broker.proxy';
import { siegemasterSpawnStreamingBrokerProxy } from '../../siegemaster/spawn-streaming/siegemaster-spawn-streaming-broker.proxy';
import { spiritmenderSpawnStreamingBrokerProxy } from '../../spiritmender/spawn-streaming/spiritmender-spawn-streaming-broker.proxy';

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
  // Note: All spawn-streaming brokers delegate to agentSpawnStreamingBroker,
  // so the last proxy created will have its mocks take effect.
  // We create all proxies to satisfy the lint rule, but only the setup
  // methods that are called will configure the mocks correctly.
  pathseekerSpawnStreamingBrokerProxy();
  codeweaverSpawnStreamingBrokerProxy();
  spiritmenderSpawnStreamingBrokerProxy();
  lawbringerSpawnStreamingBrokerProxy();
  const sharedProxy = siegemasterSpawnStreamingBrokerProxy();

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
