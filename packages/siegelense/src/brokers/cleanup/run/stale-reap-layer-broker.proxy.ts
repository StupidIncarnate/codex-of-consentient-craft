import { instanceKillBrokerProxy } from '../../instance/kill/instance-kill-broker.proxy';

export const staleReapLayerBrokerProxy = (): {
  setupRegistry: ReturnType<typeof instanceKillBrokerProxy>['setupRegistry'];
  setupDriverUnreachableReapsLivePgids: ReturnType<
    typeof instanceKillBrokerProxy
  >['setupDriverUnreachableReapsLivePgids'];
  setupDriverUnreachableNoPgids: ReturnType<
    typeof instanceKillBrokerProxy
  >['setupDriverUnreachableNoPgids'];
  setupShutdownReasonWriteSucceeds: ReturnType<
    typeof instanceKillBrokerProxy
  >['setupShutdownReasonWriteSucceeds'];
  getKillGroupCallsFor: ReturnType<typeof instanceKillBrokerProxy>['getKillGroupCallsFor'];
  getReleasedRegistry: ReturnType<typeof instanceKillBrokerProxy>['getReleasedRegistry'];
} => {
  const killProxy = instanceKillBrokerProxy();

  return {
    setupRegistry: killProxy.setupRegistry,
    setupDriverUnreachableReapsLivePgids: killProxy.setupDriverUnreachableReapsLivePgids,
    setupDriverUnreachableNoPgids: killProxy.setupDriverUnreachableNoPgids,
    setupShutdownReasonWriteSucceeds: killProxy.setupShutdownReasonWriteSucceeds,
    getKillGroupCallsFor: killProxy.getKillGroupCallsFor,
    getReleasedRegistry: killProxy.getReleasedRegistry,
  };
};
