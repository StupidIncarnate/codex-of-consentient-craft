import { questMonitorWatcherStartBrokerProxy } from '../../../brokers/quest/monitor-watcher-start/quest-monitor-watcher-start-broker.proxy';
import { monitorSessionStateProxy } from '../../../state/monitor-session/monitor-session-state.proxy';
import { orchestrationEventsStateProxy } from '../../../state/orchestration-events/orchestration-events-state.proxy';

export const QuestMonitorWatcherStartResponderProxy = (): {
  setupHomeDir: (params: { path: string }) => void;
} => {
  const brokerProxy = questMonitorWatcherStartBrokerProxy();
  const monitorStateProxy = monitorSessionStateProxy();
  monitorStateProxy.setupEmpty();
  const eventsProxy = orchestrationEventsStateProxy();
  eventsProxy.setupEmpty();

  return {
    setupHomeDir: ({ path }: { path: string }): void => {
      brokerProxy.setupHomeDir({ path });
    },
  };
};
