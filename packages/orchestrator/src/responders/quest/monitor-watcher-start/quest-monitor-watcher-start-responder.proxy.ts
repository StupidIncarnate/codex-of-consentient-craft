import { questMonitorWatcherStartBrokerProxy } from '../../../brokers/quest/monitor-watcher-start/quest-monitor-watcher-start-broker.proxy';
import { orchestrationEventsStateProxy } from '../../../state/orchestration-events/orchestration-events-state.proxy';

export const QuestMonitorWatcherStartResponderProxy = (): {
  setupHomeDir: (params: { path: string }) => void;
  setupSessionFile: (params: {
    homeDir: string;
    projectDir: string;
    parentSessionId: string;
  }) => void;
} => {
  const brokerProxy = questMonitorWatcherStartBrokerProxy();
  const eventsProxy = orchestrationEventsStateProxy();
  eventsProxy.setupEmpty();

  return {
    setupHomeDir: ({ path }: { path: string }): void => {
      brokerProxy.setupHomeDir({ path });
    },
    setupSessionFile: ({
      homeDir,
      projectDir,
      parentSessionId,
    }: {
      homeDir: string;
      projectDir: string;
      parentSessionId: string;
    }): void => {
      brokerProxy.setupSessionFile({ homeDir, projectDir, parentSessionId });
    },
  };
};
