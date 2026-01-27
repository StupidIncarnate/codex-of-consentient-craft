import { wardRunBrokerProxy } from '../../ward/run/ward-run-broker.proxy';
import { spiritmenderPhaseLayerBrokerProxy } from './spiritmender-phase-layer-broker.proxy';

export const spiritmenderLoopLayerBrokerProxy = (): {
  wardRunProxy: ReturnType<typeof wardRunBrokerProxy>;
  spiritmenderPhaseProxy: ReturnType<typeof spiritmenderPhaseLayerBrokerProxy>;
} => {
  const wardRunProxy = wardRunBrokerProxy();
  const spiritmenderPhaseProxy = spiritmenderPhaseLayerBrokerProxy();

  return {
    wardRunProxy,
    spiritmenderPhaseProxy,
  };
};
