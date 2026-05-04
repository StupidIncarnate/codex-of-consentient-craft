import { architectureBootTreeBrokerProxy } from '../boot-tree/architecture-boot-tree-broker.proxy';
import { architectureResponderAnnotationsBrokerProxy } from '../responder-annotations/architecture-responder-annotations-broker.proxy';

export const packageSectionBuildLayerBrokerProxy = (): Record<PropertyKey, never> => {
  architectureBootTreeBrokerProxy();
  architectureResponderAnnotationsBrokerProxy();
  return {};
};
