import { instanceKillBrokerProxy } from '../../instance/kill/instance-kill-broker.proxy';

export const staleReapLayerBrokerProxy = (): {
  setupRegistry: ReturnType<typeof instanceKillBrokerProxy>['setupRegistry'];
  setupDriverUnreachable: ReturnType<typeof instanceKillBrokerProxy>['setupDriverUnreachable'];
  setupDriverUnreachableNoHeartbeat: ReturnType<
    typeof instanceKillBrokerProxy
  >['setupDriverUnreachableNoHeartbeat'];
  getKillGroupCallsFor: ReturnType<typeof instanceKillBrokerProxy>['getKillGroupCallsFor'];
  getReleasedRegistry: ReturnType<typeof instanceKillBrokerProxy>['getReleasedRegistry'];
} => {
  const killProxy = instanceKillBrokerProxy();

  return {
    setupRegistry: killProxy.setupRegistry,
    setupDriverUnreachable: killProxy.setupDriverUnreachable,
    setupDriverUnreachableNoHeartbeat: killProxy.setupDriverUnreachableNoHeartbeat,
    getKillGroupCallsFor: killProxy.getKillGroupCallsFor,
    getReleasedRegistry: killProxy.getReleasedRegistry,
  };
};
