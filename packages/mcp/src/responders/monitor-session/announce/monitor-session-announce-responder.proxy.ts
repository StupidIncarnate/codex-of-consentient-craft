import {
  dungeonmasterHomeFindBrokerProxy,
  processCwdAdapterProxy,
} from '@dungeonmaster/shared/testing';

import { monitorSessionAnnounceBrokerProxy } from '../../../brokers/monitor-session/announce/monitor-session-announce-broker.proxy';
import { MonitorSessionAnnounceResponder } from './monitor-session-announce-responder';

export const MonitorSessionAnnounceResponderProxy = (): {
  callResponder: typeof MonitorSessionAnnounceResponder;
  getWrittenContent: () => unknown;
  getAllWrittenFiles: () => readonly { path: unknown; content: unknown }[];
} => {
  dungeonmasterHomeFindBrokerProxy();
  processCwdAdapterProxy();
  const announceProxy = monitorSessionAnnounceBrokerProxy();

  return {
    callResponder: MonitorSessionAnnounceResponder,
    getWrittenContent: announceProxy.getWrittenContent,
    getAllWrittenFiles: announceProxy.getAllWrittenFiles,
  };
};
