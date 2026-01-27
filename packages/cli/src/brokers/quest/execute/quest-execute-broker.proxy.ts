import { codeweaverPhaseLayerBrokerProxy } from './codeweaver-phase-layer-broker.proxy';
import { lawbringerPhaseLayerBrokerProxy } from './lawbringer-phase-layer-broker.proxy';
import { pathseekerPhaseLayerBrokerProxy } from './pathseeker-phase-layer-broker.proxy';
import { siegemasterPhaseLayerBrokerProxy } from './siegemaster-phase-layer-broker.proxy';
import { spiritmenderLoopLayerBrokerProxy } from './spiritmender-loop-layer-broker.proxy';

export const questExecuteBrokerProxy = (): {
  pathseekerProxy: ReturnType<typeof pathseekerPhaseLayerBrokerProxy>;
  codeweaverProxy: ReturnType<typeof codeweaverPhaseLayerBrokerProxy>;
  siegemasterProxy: ReturnType<typeof siegemasterPhaseLayerBrokerProxy>;
  lawbringerProxy: ReturnType<typeof lawbringerPhaseLayerBrokerProxy>;
  spiritmenderLoopProxy: ReturnType<typeof spiritmenderLoopLayerBrokerProxy>;
} => {
  const pathseekerProxy = pathseekerPhaseLayerBrokerProxy();
  const codeweaverProxy = codeweaverPhaseLayerBrokerProxy();
  const siegemasterProxy = siegemasterPhaseLayerBrokerProxy();
  const lawbringerProxy = lawbringerPhaseLayerBrokerProxy();
  const spiritmenderLoopProxy = spiritmenderLoopLayerBrokerProxy();

  return {
    pathseekerProxy,
    codeweaverProxy,
    siegemasterProxy,
    lawbringerProxy,
    spiritmenderLoopProxy,
  };
};
