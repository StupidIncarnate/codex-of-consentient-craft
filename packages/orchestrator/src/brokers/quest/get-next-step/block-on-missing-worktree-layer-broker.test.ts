import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts/quest-work-item-id/quest-work-item-id.stub';
import { WorkItemStub } from '@dungeonmaster/shared/contracts/work-item/work-item.stub';

import { blockOnMissingWorktreeLayerBroker } from './block-on-missing-worktree-layer-broker';
import { blockOnMissingWorktreeLayerBrokerProxy } from './block-on-missing-worktree-layer-broker.proxy';

describe('blockOnMissingWorktreeLayerBroker', () => {
  it('VALID: {quest with a pending work item, worktree missing} => blocks via questBlockOnFailureBroker carrying that item and the reason naming the absolute path', async () => {
    const proxy = blockOnMissingWorktreeLayerBrokerProxy();
    proxy.setupBlocked();
    const questId = QuestIdStub({ value: 'q-missing-worktree' });
    const pendingId = QuestWorkItemIdStub({ value: 'aaa00000-1111-4222-9333-444444444444' });
    const worktreePath = '/repo/worktrees/quest-1';
    const quest = QuestStub({
      id: questId,
      status: 'in_progress',
      workItems: [WorkItemStub({ id: pendingId, role: 'codeweaver', status: 'pending' })],
    });

    const result = await blockOnMissingWorktreeLayerBroker({ quest, worktreePath });

    expect({ result, blockCalls: proxy.getBlockCalls() }).toStrictEqual({
      result: { blocked: true },
      blockCalls: [
        {
          questId,
          failedWorkItemId: pendingId,
          reason: `Worktree not found: ${worktreePath}`,
        },
      ],
    });
  });

  it('VALID: {quest whose work items are all terminal} => blocks via questBlockOnFailureBroker carrying the LAST work item and the reason naming the absolute path', async () => {
    const proxy = blockOnMissingWorktreeLayerBrokerProxy();
    proxy.setupBlocked();
    const questId = QuestIdStub({ value: 'q-missing-worktree-terminal' });
    const firstId = QuestWorkItemIdStub({ value: 'bbb00000-1111-4222-9333-444444444444' });
    const lastId = QuestWorkItemIdStub({ value: 'ccc00000-1111-4222-9333-444444444444' });
    const worktreePath = '/repo/worktrees/quest-2';
    const quest = QuestStub({
      id: questId,
      status: 'in_progress',
      workItems: [
        WorkItemStub({ id: firstId, role: 'codeweaver', status: 'complete' }),
        WorkItemStub({
          id: lastId,
          role: 'ward',
          status: 'complete',
          spawnerType: 'command',
        }),
      ],
    });

    const result = await blockOnMissingWorktreeLayerBroker({ quest, worktreePath });

    expect({ result, blockCalls: proxy.getBlockCalls() }).toStrictEqual({
      result: { blocked: true },
      blockCalls: [
        {
          questId,
          failedWorkItemId: lastId,
          reason: `Worktree not found: ${worktreePath}`,
        },
      ],
    });
  });

  it('EMPTY: {quest with no work items} => writes the quest status blocked directly via questModifyBroker', async () => {
    const proxy = blockOnMissingWorktreeLayerBrokerProxy();
    const questId = QuestIdStub({ value: 'q-missing-worktree-empty' });
    const worktreePath = '/repo/worktrees/quest-3';
    const quest = QuestStub({ id: questId, status: 'in_progress', workItems: [] });
    proxy.setupQuestFound({ quest });

    const result = await blockOnMissingWorktreeLayerBroker({ quest, worktreePath });

    expect({ result, callInputs: proxy.getCallInputs() }).toStrictEqual({
      result: { blocked: true },
      callInputs: [{ questId, status: 'blocked' }],
    });
  });
});
