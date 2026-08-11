import {
  QuestPackageEntryStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

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
      packagesAffected: [
        QuestPackageEntryStub({
          name: 'orchestrator',
          location: './packages/orchestrator',
          changeType: 'edit',
          packageType: 'programmatic-service',
        }),
        QuestPackageEntryStub({
          name: 'mcp',
          location: './packages/mcp',
          changeType: 'edit',
          packageType: 'mcp-server',
        }),
      ],
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
        '- packagesAffected: orchestrator (edit, programmatic-service), mcp (edit, mcp-server)',
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
      packagesAffected: [
        QuestPackageEntryStub({
          name: 'shared',
          location: './packages/shared',
          changeType: 'edit',
          packageType: 'library',
        }),
      ],
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
        '- packagesAffected: shared (edit, library)',
      ].join('\n'),
    );
  });

  it("VALID: {a 'new' entry} => renders its declared packageType beside the changeType", () => {
    const workItem = WorkItemStub({
      id: QuestWorkItemIdStub({ value: 'eeeeeeee-1111-4222-9333-444444444444' }),
      role: 'codeweaver',
    });
    const quest = QuestStub({
      packagesAffected: [
        QuestPackageEntryStub({
          name: 'groundstomp',
          location: './packages/groundstomp',
          changeType: 'new',
          packageType: 'frontend-ink',
          usedBy: ['orchestrator'],
        }),
      ],
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
        '- role: codeweaver',
        '- packagesAffected: groundstomp (new, frontend-ink)',
      ].join('\n'),
    );
  });

  it('VALID: {workItem carrying packageNames} => appends the work item’s own slice below the quest-wide list', () => {
    const workItem = WorkItemStub({
      id: QuestWorkItemIdStub({ value: 'ffffffff-1111-4222-9333-444444444444' }),
      role: 'flowrider',
      packageNames: ['web', 'server'],
    });
    const quest = QuestStub({
      packagesAffected: [
        QuestPackageEntryStub({
          name: 'web',
          location: './packages/web',
          changeType: 'edit',
          packageType: 'frontend-react',
        }),
        QuestPackageEntryStub({
          name: 'server',
          location: './packages/server',
          changeType: 'edit',
          packageType: 'http-backend',
        }),
      ],
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
        '- packagesAffected: web (edit, frontend-react), server (edit, http-backend)',
        '- packageNames: web, server',
      ].join('\n'),
    );
  });

  it('EMPTY: {workItem carrying an empty packageNames array} => omits the slice line rather than printing an empty one', () => {
    const workItem = WorkItemStub({
      id: QuestWorkItemIdStub({ value: 'aaaaaaaa-2222-4222-9333-444444444444' }),
      role: 'flowrider',
      packageNames: [],
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
        '- role: flowrider',
      ].join('\n'),
    );
  });
});
