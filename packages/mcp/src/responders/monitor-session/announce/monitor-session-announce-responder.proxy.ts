import {
  dungeonmasterHomeFindBrokerProxy,
  processCwdAdapterProxy,
} from '@dungeonmaster/shared/testing';

import { monitorSessionAnnounceBrokerProxy } from '../../../brokers/monitor-session/announce/monitor-session-announce-broker.proxy';
import { claudeCodeSessionResolveBrokerProxy } from '../../../brokers/claude-code-session/resolve/claude-code-session-resolve-broker.proxy';
import { MonitorSessionAnnounceResponder } from './monitor-session-announce-responder';

export const MonitorSessionAnnounceResponderProxy = (): {
  callResponder: typeof MonitorSessionAnnounceResponder;
  setupResolvedSessionId: (params: { sessionId: string }) => void;
  getWrittenContent: () => unknown;
  getAllWrittenFiles: () => readonly { path: unknown; content: unknown }[];
} => {
  dungeonmasterHomeFindBrokerProxy();
  processCwdAdapterProxy();
  const announceProxy = monitorSessionAnnounceBrokerProxy();
  const resolverProxy = claudeCodeSessionResolveBrokerProxy();

  return {
    callResponder: MonitorSessionAnnounceResponder,
    setupResolvedSessionId: ({ sessionId }: { sessionId: string }): void => {
      resolverProxy.setupHomedir({ homedir: '/home/u' });
      resolverProxy.setupSessionsDir({
        entries: [{ name: `${sessionId}.jsonl`, mtimeMs: 1 }],
      });
    },
    getWrittenContent: announceProxy.getWrittenContent,
    getAllWrittenFiles: announceProxy.getAllWrittenFiles,
  };
};
