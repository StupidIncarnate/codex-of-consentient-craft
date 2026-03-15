import type { ExitCode } from '@dungeonmaster/shared/contracts';

import { codeweaverPhaseLayerBrokerProxy } from './codeweaver-phase-layer-broker.proxy';
import { lawbringerPhaseLayerBrokerProxy } from './lawbringer-phase-layer-broker.proxy';
import { siegemasterPhaseLayerBrokerProxy } from './siegemaster-phase-layer-broker.proxy';
import { wardPhaseLayerBrokerProxy } from './ward-phase-layer-broker.proxy';

export const questPipelineBrokerProxy = (): {
  setupCodeweaverQuestLoad: (params: { questJson: string }) => void;
  setupCodeweaverQuestLoadError: (params: { error: Error }) => void;
  setupWardSuccessFirstTry: (params: { exitCode: ExitCode }) => void;
  setupWardFailMaxRetries: (params: {
    failExitCode: ExitCode;
    failWardResultJson: string;
    spiritmenderExitCode: ExitCode;
  }) => void;
  setupSiegemasterQuestLoad: (params: { questJson: string }) => void;
  setupSiegemasterQuestLoadError: (params: { error: Error }) => void;
  setupLawbringerQuestLoad: (params: { questJson: string }) => void;
  setupLawbringerQuestLoadError: (params: { error: Error }) => void;
} => {
  const codeweaver = codeweaverPhaseLayerBrokerProxy();
  const siegemaster = siegemasterPhaseLayerBrokerProxy();
  const lawbringer = lawbringerPhaseLayerBrokerProxy();
  // Ward must be last — its spawnWardLayerBrokerProxy mocks child_process.spawn and
  // must be the final mockImplementation so it captures ward-specific spawn calls.
  const ward = wardPhaseLayerBrokerProxy();

  return {
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
    setupSiegemasterQuestLoad: ({ questJson }: { questJson: string }): void => {
      siegemaster.setupQuestLoad({ questJson });
    },
    setupSiegemasterQuestLoadError: ({ error }: { error: Error }): void => {
      siegemaster.setupQuestLoadError({ error });
    },
    setupLawbringerQuestLoad: ({ questJson }: { questJson: string }): void => {
      lawbringer.setupQuestLoad({ questJson });
    },
    setupLawbringerQuestLoadError: ({ error }: { error: Error }): void => {
      lawbringer.setupQuestLoadError({ error });
    },
  };
};
