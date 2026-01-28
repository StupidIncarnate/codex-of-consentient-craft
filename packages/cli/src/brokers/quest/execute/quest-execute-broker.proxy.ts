import type { ExitCode } from '@dungeonmaster/shared/contracts';

import type { StreamJsonLine } from '../../../contracts/stream-json-line/stream-json-line-contract';
import { codeweaverPhaseLayerBrokerProxy } from './codeweaver-phase-layer-broker.proxy';
import { lawbringerPhaseLayerBrokerProxy } from './lawbringer-phase-layer-broker.proxy';
import { pathseekerPhaseLayerBrokerProxy } from './pathseeker-phase-layer-broker.proxy';
import { siegemasterPhaseLayerBrokerProxy } from './siegemaster-phase-layer-broker.proxy';
import { spiritmenderLoopLayerBrokerProxy } from './spiritmender-loop-layer-broker.proxy';

export const questExecuteBrokerProxy = (): {
  setupPathseekerQuestFile: (params: { questJson: string }) => void;
  setupPathseekerQuestFileError: (params: { error: Error }) => void;
  setupPathseekerNeedsUserInput: (params: {
    pendingQuestJson: string;
    inProgressQuestJson: string;
    blockedQuestJson: string;
    exitCode: ExitCode;
    signalLines: readonly StreamJsonLine[];
  }) => void;
  setupCodeweaverQuestFile: (params: { questJson: string }) => void;
  setupCodeweaverNeedsUserInput: (params: {
    pendingQuestJson: string;
    inProgressQuestJson: string;
    blockedQuestJson: string;
    exitCode: ExitCode;
    signalLines: readonly StreamJsonLine[];
  }) => void;
  setupSiegemasterQuestFile: (params: { questJson: string }) => void;
  setupSiegemasterNeedsUserInput: (params: {
    pendingQuestJson: string;
    inProgressQuestJson: string;
    blockedQuestJson: string;
    exitCode: ExitCode;
    signalLines: readonly StreamJsonLine[];
  }) => void;
  setupLawbringerQuestFile: (params: { questJson: string }) => void;
  setupLawbringerNeedsUserInput: (params: {
    pendingQuestJson: string;
    inProgressQuestJson: string;
    blockedQuestJson: string;
    exitCode: ExitCode;
    signalLines: readonly StreamJsonLine[];
  }) => void;
  setupSpiritWardPasses: (params: { output: string }) => void;
  setupSpiritWardFails: (params: { stdout?: string; stderr?: string }) => void;
  setupSpiritQuestFile: (params: { questJson: string }) => void;
} => {
  const pathseekerProxy = pathseekerPhaseLayerBrokerProxy();
  const codeweaverProxy = codeweaverPhaseLayerBrokerProxy();
  const siegemasterProxy = siegemasterPhaseLayerBrokerProxy();
  const lawbringerProxy = lawbringerPhaseLayerBrokerProxy();
  const spiritmenderLoopProxy = spiritmenderLoopLayerBrokerProxy();

  return {
    setupPathseekerQuestFile: ({ questJson }: { questJson: string }): void => {
      pathseekerProxy.setupQuestFile({ questJson });
    },
    setupPathseekerQuestFileError: ({ error }: { error: Error }): void => {
      pathseekerProxy.setupQuestFileError({ error });
    },
    setupPathseekerNeedsUserInput: ({
      pendingQuestJson,
      inProgressQuestJson,
      blockedQuestJson,
      exitCode,
      signalLines,
    }: {
      pendingQuestJson: string;
      inProgressQuestJson: string;
      blockedQuestJson: string;
      exitCode: ExitCode;
      signalLines: readonly StreamJsonLine[];
    }): void => {
      pathseekerProxy.setupQuestFile({ questJson: pendingQuestJson });
      pathseekerProxy.setupQuestUpdateRead({ questJson: pendingQuestJson });
      pathseekerProxy.setupQuestUpdateWrite();
      pathseekerProxy.setupAgentSpawnWithSignal({ exitCode, lines: signalLines });
      pathseekerProxy.setupQuestUpdateRead({ questJson: inProgressQuestJson });
      pathseekerProxy.setupQuestUpdateWrite();
      pathseekerProxy.setupSignalQuestUpdate({ questJson: blockedQuestJson });
    },
    setupCodeweaverQuestFile: ({ questJson }: { questJson: string }): void => {
      codeweaverProxy.setupQuestFile({ questJson });
    },
    setupCodeweaverNeedsUserInput: ({
      pendingQuestJson,
      inProgressQuestJson,
      blockedQuestJson,
      exitCode,
      signalLines,
    }: {
      pendingQuestJson: string;
      inProgressQuestJson: string;
      blockedQuestJson: string;
      exitCode: ExitCode;
      signalLines: readonly StreamJsonLine[];
    }): void => {
      codeweaverProxy.setupQuestFile({ questJson: pendingQuestJson });
      codeweaverProxy.setupQuestUpdateRead({ questJson: pendingQuestJson });
      codeweaverProxy.setupQuestUpdateWrite();
      codeweaverProxy.setupAgentSpawnWithSignal({ exitCode, lines: signalLines });
      codeweaverProxy.setupQuestUpdateRead({ questJson: inProgressQuestJson });
      codeweaverProxy.setupQuestUpdateWrite();
      codeweaverProxy.setupSignalQuestUpdate({ questJson: blockedQuestJson });
    },
    setupSiegemasterQuestFile: ({ questJson }: { questJson: string }): void => {
      siegemasterProxy.setupQuestFile({ questJson });
    },
    setupSiegemasterNeedsUserInput: ({
      pendingQuestJson,
      inProgressQuestJson,
      blockedQuestJson,
      exitCode,
      signalLines,
    }: {
      pendingQuestJson: string;
      inProgressQuestJson: string;
      blockedQuestJson: string;
      exitCode: ExitCode;
      signalLines: readonly StreamJsonLine[];
    }): void => {
      siegemasterProxy.setupQuestFile({ questJson: pendingQuestJson });
      siegemasterProxy.setupQuestUpdateRead({ questJson: pendingQuestJson });
      siegemasterProxy.setupQuestUpdateWrite();
      siegemasterProxy.setupAgentSpawnWithSignal({ exitCode, lines: signalLines });
      siegemasterProxy.setupQuestUpdateRead({ questJson: inProgressQuestJson });
      siegemasterProxy.setupQuestUpdateWrite();
      siegemasterProxy.setupSignalQuestUpdate({ questJson: blockedQuestJson });
    },
    setupLawbringerQuestFile: ({ questJson }: { questJson: string }): void => {
      lawbringerProxy.setupQuestFile({ questJson });
    },
    setupLawbringerNeedsUserInput: ({
      pendingQuestJson,
      inProgressQuestJson,
      blockedQuestJson,
      exitCode,
      signalLines,
    }: {
      pendingQuestJson: string;
      inProgressQuestJson: string;
      blockedQuestJson: string;
      exitCode: ExitCode;
      signalLines: readonly StreamJsonLine[];
    }): void => {
      lawbringerProxy.setupQuestFile({ questJson: pendingQuestJson });
      lawbringerProxy.setupQuestUpdateRead({ questJson: pendingQuestJson });
      lawbringerProxy.setupQuestUpdateWrite();
      lawbringerProxy.setupAgentSpawnWithSignal({ exitCode, lines: signalLines });
      lawbringerProxy.setupQuestUpdateRead({ questJson: inProgressQuestJson });
      lawbringerProxy.setupQuestUpdateWrite();
      lawbringerProxy.setupSignalQuestUpdate({ questJson: blockedQuestJson });
    },
    setupSpiritWardPasses: ({ output }: { output: string }): void => {
      spiritmenderLoopProxy.setupWardPasses({ output });
    },
    setupSpiritWardFails: (params: { stdout?: string; stderr?: string }): void => {
      spiritmenderLoopProxy.setupWardFails(params);
    },
    setupSpiritQuestFile: ({ questJson }: { questJson: string }): void => {
      spiritmenderLoopProxy.setupQuestFile({ questJson });
    },
  };
};
