import { instanceKillBrokerProxy } from '../../instance/kill/instance-kill-broker.proxy';

export const staleReapLayerBrokerProxy = (): {
  repoRoot: ReturnType<typeof instanceKillBrokerProxy>['repoRoot'];
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
  getWrittenShutdownReason: ReturnType<typeof instanceKillBrokerProxy>['getWrittenShutdownReason'];
  getKillGroupCallsFor: ReturnType<typeof instanceKillBrokerProxy>['getKillGroupCallsFor'];
  getReleasedRegistry: ReturnType<typeof instanceKillBrokerProxy>['getReleasedRegistry'];
} => {
  const killProxy = instanceKillBrokerProxy();

  return {
    repoRoot: killProxy.repoRoot,
    setupRegistry: killProxy.setupRegistry,
    setupDriverUnreachableReapsLivePgids: killProxy.setupDriverUnreachableReapsLivePgids,
    setupDriverUnreachableNoPgids: killProxy.setupDriverUnreachableNoPgids,
    setupShutdownReasonWriteSucceeds: killProxy.setupShutdownReasonWriteSucceeds,
    getWrittenShutdownReason: killProxy.getWrittenShutdownReason,
    getKillGroupCallsFor: killProxy.getKillGroupCallsFor,
    getReleasedRegistry: killProxy.getReleasedRegistry,
  };
};
