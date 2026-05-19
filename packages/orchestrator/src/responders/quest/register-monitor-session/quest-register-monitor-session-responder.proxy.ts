import { questMonitorJsonlWatcherBrokerProxy } from '../../../brokers/quest/monitor-jsonl-watcher/quest-monitor-jsonl-watcher-broker.proxy';
import { questRegisterMonitorSessionBrokerProxy } from '../../../brokers/quest/register-monitor-session/quest-register-monitor-session-broker.proxy';
import { activeQuestStateProxy } from '../../../state/active-quest/active-quest-state.proxy';
import { monitorSessionStateProxy } from '../../../state/monitor-session/monitor-session-state.proxy';
import { orchestrationEventsStateProxy } from '../../../state/orchestration-events/orchestration-events-state.proxy';
import { QuestRegisterMonitorSessionResponder } from './quest-register-monitor-session-responder';

export const QuestRegisterMonitorSessionResponderProxy = (): {
  callResponder: typeof QuestRegisterMonitorSessionResponder;
  setupGuildsAndQuests: ReturnType<
    typeof questRegisterMonitorSessionBrokerProxy
  >['setupGuildsAndQuests'];
  setupQuestModifyForOrphanReset: ReturnType<
    typeof questRegisterMonitorSessionBrokerProxy
  >['setupQuestModifyForOrphanReset'];
  setupProjectDir: ReturnType<typeof questRegisterMonitorSessionBrokerProxy>['setupProjectDir'];
  setupEmptyMonitorSession: ReturnType<typeof monitorSessionStateProxy>['setupEmpty'];
  setupEmptyActiveQuest: ReturnType<typeof activeQuestStateProxy>['setupEmpty'];
  setupEmptyOrchestrationEvents: ReturnType<typeof orchestrationEventsStateProxy>['setupEmpty'];
  getAllPersistedContents: ReturnType<
    typeof questRegisterMonitorSessionBrokerProxy
  >['getAllPersistedContents'];
} => {
  const registerProxy = questRegisterMonitorSessionBrokerProxy();
  const monitorSessionProxy = monitorSessionStateProxy();
  const activeQuestProxy = activeQuestStateProxy();
  const orchestrationEventsProxy = orchestrationEventsStateProxy();
  // The responder also starts a JSONL watcher; instantiate its proxy so the file-watch
  // adapter calls inside questMonitorJsonlWatcherBroker get mocked (no real fs.watch).
  const watcherProxy = questMonitorJsonlWatcherBrokerProxy();
  // Default: pretend the watcher has no subagent files to scan.
  watcherProxy.setupSubagentDirEmpty();

  return {
    callResponder: QuestRegisterMonitorSessionResponder,
    setupGuildsAndQuests: registerProxy.setupGuildsAndQuests,
    setupQuestModifyForOrphanReset: registerProxy.setupQuestModifyForOrphanReset,
    setupProjectDir: registerProxy.setupProjectDir,
    setupEmptyMonitorSession: monitorSessionProxy.setupEmpty,
    setupEmptyActiveQuest: activeQuestProxy.setupEmpty,
    setupEmptyOrchestrationEvents: orchestrationEventsProxy.setupEmpty,
    getAllPersistedContents: registerProxy.getAllPersistedContents,
  };
};
