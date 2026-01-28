import type { ExitCode } from '@dungeonmaster/shared/contracts';

import type { StreamJsonLine } from '../../../contracts/stream-json-line/stream-json-line-contract';
import { agentSpawnByRoleBrokerProxy } from '../../agent/spawn-by-role/agent-spawn-by-role-broker.proxy';

export const spawnAgentLayerBrokerProxy = (): {
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
  const agentSpawnByRoleProxy = agentSpawnByRoleBrokerProxy();

  return {
    setupPathseekerSuccess: ({ exitCode }: { exitCode: ExitCode }): void => {
      agentSpawnByRoleProxy.setupPathseekerSuccess({ exitCode });
    },

    setupPathseekerSuccessWithSignal: ({
      exitCode,
      lines,
    }: {
      exitCode: ExitCode;
      lines: readonly StreamJsonLine[];
    }): void => {
      agentSpawnByRoleProxy.setupPathseekerSuccessWithSignal({ exitCode, lines });
    },

    setupPathseekerCrash: ({ exitCode }: { exitCode: ExitCode }): void => {
      agentSpawnByRoleProxy.setupPathseekerCrash({ exitCode });
    },

    setupCodeweaverSuccess: ({ exitCode }: { exitCode: ExitCode }): void => {
      agentSpawnByRoleProxy.setupCodeweaverSuccess({ exitCode });
    },

    setupCodeweaverSuccessWithSignal: ({
      exitCode,
      lines,
    }: {
      exitCode: ExitCode;
      lines: readonly StreamJsonLine[];
    }): void => {
      agentSpawnByRoleProxy.setupCodeweaverSuccessWithSignal({ exitCode, lines });
    },

    setupCodeweaverTimeout: (): void => {
      agentSpawnByRoleProxy.setupCodeweaverTimeout();
    },

    setupCodeweaverCrash: ({ exitCode }: { exitCode: ExitCode }): void => {
      agentSpawnByRoleProxy.setupCodeweaverCrash({ exitCode });
    },

    setupSpiritmenderSuccess: ({ exitCode }: { exitCode: ExitCode }): void => {
      agentSpawnByRoleProxy.setupSpiritmenderSuccess({ exitCode });
    },

    setupSpiritmenderSuccessWithSignal: ({
      exitCode,
      lines,
    }: {
      exitCode: ExitCode;
      lines: readonly StreamJsonLine[];
    }): void => {
      agentSpawnByRoleProxy.setupSpiritmenderSuccessWithSignal({ exitCode, lines });
    },

    setupSpiritmenderError: ({ error }: { error: Error }): void => {
      agentSpawnByRoleProxy.setupSpiritmenderError({ error });
    },

    setupLawbringerSuccess: ({ exitCode }: { exitCode: ExitCode }): void => {
      agentSpawnByRoleProxy.setupLawbringerSuccess({ exitCode });
    },

    setupLawbringerSuccessWithSignal: ({
      exitCode,
      lines,
    }: {
      exitCode: ExitCode;
      lines: readonly StreamJsonLine[];
    }): void => {
      agentSpawnByRoleProxy.setupLawbringerSuccessWithSignal({ exitCode, lines });
    },

    setupSiegemasterSuccess: ({ exitCode }: { exitCode: ExitCode }): void => {
      agentSpawnByRoleProxy.setupSiegemasterSuccess({ exitCode });
    },

    setupSiegemasterSuccessWithSignal: ({
      exitCode,
      lines,
    }: {
      exitCode: ExitCode;
      lines: readonly StreamJsonLine[];
    }): void => {
      agentSpawnByRoleProxy.setupSiegemasterSuccessWithSignal({ exitCode, lines });
    },
  };
};
