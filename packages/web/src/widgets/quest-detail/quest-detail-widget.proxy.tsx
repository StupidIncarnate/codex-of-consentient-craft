import { questVerifyBrokerProxy } from '../../brokers/quest/verify/quest-verify-broker.proxy';
import { ExecutionDashboardWidgetProxy } from '../execution-dashboard/execution-dashboard-widget.proxy';

export const QuestDetailWidgetProxy = (): {
  setupVerifySuccess: () => void;
  setupVerifyError: () => void;
} => {
  const verifyProxy = questVerifyBrokerProxy();
  ExecutionDashboardWidgetProxy();

  return {
    setupVerifySuccess: (): void => {
      verifyProxy.setupVerify({
        result: { success: true, checks: [] },
      });
    },
    setupVerifyError: (): void => {
      verifyProxy.setupError({ error: new Error('Verification failed') });
    },
  };
};
