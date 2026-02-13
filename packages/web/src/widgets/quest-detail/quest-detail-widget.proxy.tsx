import { questVerifyBrokerProxy } from '../../brokers/quest/verify/quest-verify-broker.proxy';
import type { QuestVerifyResult } from '../../contracts/quest-verify-result/quest-verify-result-contract';
import { ExecutionDashboardWidgetProxy } from '../execution-dashboard/execution-dashboard-widget.proxy';

export const QuestDetailWidgetProxy = (): {
  setupVerifySuccess: (params?: { result: QuestVerifyResult }) => void;
  setupVerifyError: () => void;
} => {
  const verifyProxy = questVerifyBrokerProxy();
  ExecutionDashboardWidgetProxy();

  return {
    setupVerifySuccess: (params?: { result: QuestVerifyResult }): void => {
      verifyProxy.setupVerify({
        result: params?.result ?? { success: true, checks: [] },
      });
    },
    setupVerifyError: (): void => {
      verifyProxy.setupError();
    },
  };
};
