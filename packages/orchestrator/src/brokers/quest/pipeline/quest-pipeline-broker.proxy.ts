import type { ExitCode } from '@dungeonmaster/shared/contracts';

// pathseeker MUST be created first - its mockImplementation for child_process.spawn
// gets overwritten by later proxies. It uses mockReturnValueOnce instead.
import { pathseekerPhaseLayerBrokerProxy } from './pathseeker-phase-layer-broker.proxy';
import { codeweaverPhaseLayerBrokerProxy } from './codeweaver-phase-layer-broker.proxy';
import { lawbringerPhaseLayerBrokerProxy } from './lawbringer-phase-layer-broker.proxy';
import { siegemasterPhaseLayerBrokerProxy } from './siegemaster-phase-layer-broker.proxy';
// Ward must be last - both capture and stream-json proxies mock child_process.spawn.
import { wardPhaseLayerBrokerProxy } from './ward-phase-layer-broker.proxy';

export const questPipelineBrokerProxy = (): {
  setupPathseekerSpawnSuccess: () => void;
  setupPathseekerSpawnFailure: () => void;
  setupCodeweaverQuestLoad: (params: { questJson: string }) => void;
  setupCodeweaverQuestLoadError: (params: { error: Error }) => void;
  setupWardSuccessFirstTry: (params: { exitCode: ExitCode }) => void;
  setupWardFailMaxRetries: (params: {
    failExitCode: ExitCode;
    failWardResultJson: string;
    spiritmenderExitCode: ExitCode;
  }) => void;
  setupSiegemasterQuestFile: (params: { questJson: string }) => void;
  setupSiegemasterSpawnsSucceed: (params: { exitCode: ExitCode }) => void;
  setupSiegemasterSpawnFailure: () => void;
  setupLawbringerQuestFile: (params: { questJson: string }) => void;
  setupLawbringerSpawnsSucceed: (params: { exitCode: ExitCode }) => void;
  setupLawbringerSpawnFailure: () => void;
} => {
  // Pathseeker first: uses mockReturnValueOnce for its single spawn call
  const pathseeker = pathseekerPhaseLayerBrokerProxy();
  const codeweaver = codeweaverPhaseLayerBrokerProxy();
  const ward = wardPhaseLayerBrokerProxy();
  const siegemaster = siegemasterPhaseLayerBrokerProxy();
  const lawbringer = lawbringerPhaseLayerBrokerProxy();

  return {
    setupPathseekerSpawnSuccess: (): void => {
      pathseeker.setupSpawnSuccess();
    },
    setupPathseekerSpawnFailure: (): void => {
      pathseeker.setupSpawnFailure();
    },
    setupCodeweaverQuestLoad: ({ questJson }: { questJson: string }): void => {
      codeweaver.setupQuestLoad({ questJson });
    },
    setupCodeweaverQuestLoadError: ({ error }: { error: Error }): void => {
      codeweaver.setupQuestLoadError({ error });
    },
    setupWardSuccessFirstTry: ({ exitCode }: { exitCode: ExitCode }): void => {
      ward.setupWardSuccessFirstTry({ exitCode });
    },
    setupWardFailMaxRetries: ({
      failExitCode,
      failWardResultJson,
      spiritmenderExitCode,
    }: {
      failExitCode: ExitCode;
      failWardResultJson: string;
      spiritmenderExitCode: ExitCode;
    }): void => {
      ward.setupWardFailMaxRetries({ failExitCode, failWardResultJson, spiritmenderExitCode });
    },
    setupSiegemasterQuestFile: ({ questJson }: { questJson: string }): void => {
      siegemaster.setupQuestFile({ questJson });
    },
    setupSiegemasterSpawnsSucceed: ({ exitCode }: { exitCode: ExitCode }): void => {
      siegemaster.setupAllSpawnsSucceed({ exitCode });
    },
    setupSiegemasterSpawnFailure: (): void => {
      siegemaster.setupSpawnFailure();
    },
    setupLawbringerQuestFile: ({ questJson }: { questJson: string }): void => {
      lawbringer.setupQuestFile({ questJson });
    },
    setupLawbringerSpawnsSucceed: ({ exitCode }: { exitCode: ExitCode }): void => {
      lawbringer.setupAllSpawnsSucceed({ exitCode });
    },
    setupLawbringerSpawnFailure: (): void => {
      lawbringer.setupSpawnFailure();
    },
  };
};
