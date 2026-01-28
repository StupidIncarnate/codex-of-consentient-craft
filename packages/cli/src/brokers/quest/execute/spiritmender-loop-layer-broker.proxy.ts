import { wardRunBrokerProxy } from '../../ward/run/ward-run-broker.proxy';
import { spiritmenderPhaseLayerBrokerProxy } from './spiritmender-phase-layer-broker.proxy';

export const spiritmenderLoopLayerBrokerProxy = (): {
  setupWardPasses: (params: { output: string }) => void;
  setupWardFails: (params: { stdout?: string; stderr?: string }) => void;
  setupQuestFile: (params: { questJson: string }) => void;
} => {
  const wardRunProxy = wardRunBrokerProxy();
  const spiritmenderPhaseProxy = spiritmenderPhaseLayerBrokerProxy();

  return {
    setupWardPasses: ({ output }: { output: string }): void => {
      wardRunProxy.setupWardPasses({ output });
    },
    setupWardFails: (params: { stdout?: string; stderr?: string }): void => {
      wardRunProxy.setupWardFails(params);
    },
    setupQuestFile: ({ questJson }: { questJson: string }): void => {
      spiritmenderPhaseProxy.setupQuestFile({ questJson });
    },
  };
};
