import { QuestStub, QuestWorkItemIdStub, WorkItemStub } from '@dungeonmaster/shared/contracts';

import { workItemContextBlockTransformer } from './work-item-context-block-transformer';

describe('workItemContextBlockTransformer', () => {
  it('VALID: {quest, workItem with no packagesAffected and no wardMode} => returns minimal context block', () => {
    const workItem = WorkItemStub({
      id: QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' }),
      role: 'codeweaver',
    });
    const quest = QuestStub({ workItems: [workItem] });

    const result = workItemContextBlockTransformer({ quest, workItem });

    expect(result).toBe(
      [
        '',
        '---',
        '',
        '## Work item context',
        '',
        `- questId: ${quest.id}`,
        `- workItemId: ${workItem.id}`,
        '- role: codeweaver',
      ].join('\n'),
    );
  });

  it('VALID: {quest with packagesAffected, workItem with wardMode} => appends both lines', () => {
    const workItem = WorkItemStub({
      id: QuestWorkItemIdStub({ value: 'cccccccc-1111-4222-9333-444444444444' }),
      role: 'ward',
      wardMode: 'full',
    });
    const quest = QuestStub({
      packagesAffected: ['orchestrator', 'mcp'],
      workItems: [workItem],
    });

    const result = workItemContextBlockTransformer({ quest, workItem });

    expect(result).toBe(
      [
        '',
        '---',
        '',
        '## Work item context',
        '',
        `- questId: ${quest.id}`,
        `- workItemId: ${workItem.id}`,
        '- role: ward',
        '- packagesAffected: orchestrator, mcp',
        '- wardMode: full',
      ].join('\n'),
    );
  });

  it('VALID: {quest with packagesAffected only} => appends packagesAffected line but not wardMode', () => {
    const workItem = WorkItemStub({
      id: QuestWorkItemIdStub({ value: 'dddddddd-1111-4222-9333-444444444444' }),
      role: 'flowrider',
    });
    const quest = QuestStub({
      packagesAffected: ['shared'],
      workItems: [workItem],
    });

    const result = workItemContextBlockTransformer({ quest, workItem });

    expect(result).toBe(
      [
        '',
        '---',
        '',
        '## Work item context',
        '',
        `- questId: ${quest.id}`,
        `- workItemId: ${workItem.id}`,
        '- role: flowrider',
        '- packagesAffected: shared',
      ].join('\n'),
    );
  });
});
