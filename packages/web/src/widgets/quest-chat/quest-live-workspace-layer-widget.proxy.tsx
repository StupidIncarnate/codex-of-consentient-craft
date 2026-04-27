import type { ProcessId } from '@dungeonmaster/shared/contracts';
import type { RequestCount } from '@dungeonmaster/testing';

import { useQuestChatBindingProxy } from '../../bindings/use-quest-chat/use-quest-chat-binding.proxy';
import { questAbandonBrokerProxy } from '../../brokers/quest/abandon/quest-abandon-broker.proxy';
import { questModifyBrokerProxy } from '../../brokers/quest/modify/quest-modify-broker.proxy';
import { questPauseBrokerProxy } from '../../brokers/quest/pause/quest-pause-broker.proxy';
import { questResumeBrokerProxy } from '../../brokers/quest/resume/quest-resume-broker.proxy';
import { ChatPanelWidgetProxy } from '../chat-panel/chat-panel-widget.proxy';
import { DumpsterRaccoonWidgetProxy } from '../dumpster-raccoon/dumpster-raccoon-widget.proxy';
import { ExecutionPanelWidgetProxy } from '../execution-panel/execution-panel-widget.proxy';

export const QuestLiveWorkspaceLayerWidgetProxy = ({
  deferOpen = false,
}: { deferOpen?: boolean } = {}): {
  receiveWsMessage: (params: { data: string }) => void;
  triggerWsOpen: () => void;
  setupChat: (params: { chatProcessId: ProcessId }) => void;
  setupPause: () => void;
  getChatRequestCount: () => RequestCount;
  getPauseRequestCount: () => RequestCount;
} => {
  const binding = useQuestChatBindingProxy({ deferOpen });
  questAbandonBrokerProxy();
  questModifyBrokerProxy();
  questPauseBrokerProxy();
  questResumeBrokerProxy();
  ChatPanelWidgetProxy();
  ExecutionPanelWidgetProxy();
  DumpsterRaccoonWidgetProxy();
  return {
    receiveWsMessage: ({ data }: { data: string }): void => {
      binding.receiveWsMessage({ data });
    },
    triggerWsOpen: (): void => {
      binding.triggerWsOpen();
    },
    setupChat: ({ chatProcessId }: { chatProcessId: ProcessId }): void => {
      binding.setupChat({ chatProcessId });
    },
    setupPause: (): void => {
      binding.setupPause();
    },
    getChatRequestCount: (): RequestCount => binding.getChatRequestCount(),
    getPauseRequestCount: (): RequestCount => binding.getPauseRequestCount(),
  };
};
