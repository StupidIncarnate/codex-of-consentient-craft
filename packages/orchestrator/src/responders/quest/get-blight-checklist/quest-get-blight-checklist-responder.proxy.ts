/**
 * PURPOSE: Proxy for QuestGetBlightChecklistResponder. Delegates to the broker proxy for quest
 * find/load, guild, cwd, and git diff mocks.
 *
 * USAGE:
 * const proxy = QuestGetBlightChecklistResponderProxy();
 * proxy.setupQuestFound({ quest });
 * proxy.setupDiff({ files: ['packages/web/src/widgets/foo/foo-widget.tsx'] });
 * const result = await proxy.callResponder({ questId: 'add-auth' });
 */

import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { questGetBlightChecklistBrokerProxy } from '../../../brokers/quest/get-blight-checklist/quest-get-blight-checklist-broker.proxy';
import { QuestGetBlightChecklistResponder } from './quest-get-blight-checklist-responder';

type Quest = ReturnType<typeof QuestStub>;

export const QuestGetBlightChecklistResponderProxy = (): {
  callResponder: typeof QuestGetBlightChecklistResponder;
  setupQuestFound: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
  setupDiff: (params: { files: readonly string[] }) => void;
  getGitDiffArgs: () => unknown;
} => {
  const brokerProxy = questGetBlightChecklistBrokerProxy();

  return {
    callResponder: QuestGetBlightChecklistResponder,

    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      brokerProxy.setupQuestFound({ quest });
    },

    setupQuestNotFound: (): void => {
      brokerProxy.setupQuestNotFound();
    },

    setupDiff: ({ files }: { files: readonly string[] }): void => {
      brokerProxy.setupDiff({ files });
    },

    getGitDiffArgs: (): unknown => brokerProxy.getGitDiffArgs(),
  };
};
