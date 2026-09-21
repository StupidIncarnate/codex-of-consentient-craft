import {
  OperationItemStub,
  PackageGraphEntryStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';
import { questTypeRegistryStatics } from '@dungeonmaster/shared/statics';

import { questBuildRelayGraphBroker } from './quest-build-relay-graph-broker';
import { questBuildRelayGraphBrokerProxy } from './quest-build-relay-graph-broker.proxy';
import { IsoTimestampStub } from '../../../contracts/iso-timestamp/iso-timestamp.stub';

type QuestTypeKey = keyof typeof questTypeRegistryStatics;

const QUEST_TYPES = Object.keys(questTypeRegistryStatics) as readonly QuestTypeKey[];

const UUIDS = [
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000004',
] as const;

describe('questBuildRelayGraphBroker', () => {
  // Both quest types name `riftcarver` as `questFlowStatics[questType].entry`, so the same body
  // proves this holds for each — the mint transformer reads only the entry family's own seed, which
  // both registry entries carry identically.
  describe('entry family scope seeded at Start', () => {
    it.each(QUEST_TYPES)(
      'VALID: {%s quest, empty ledger} => the ENTRY family mints its one riftcarver scope, flipped in_progress as the sole actionable item, and the sole work item is a command spawner carrying step "carve"',
      (questType) => {
        const proxy = questBuildRelayGraphBrokerProxy();
        proxy.setupUuids({ ids: UUIDS });

        const quest = QuestStub({ questType, operations: [] });
        const priorId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });

        const result = questBuildRelayGraphBroker({
          quest,
          priorWorkItemIds: [priorId],
          now: IsoTimestampStub(),
        });

        expect(result).toStrictEqual({
          operations: [
            OperationItemStub({
              id: '00000000-0000-4000-8000-000000000001',
              role: 'riftcarver',
              text: 'Riftcarver: carve the quest branch, worktree and preflight typecheck',
              status: 'in_progress',
              locked: true,
              packageNames: [],
            }),
          ],
          workItems: [
            WorkItemStub({
              id: QuestWorkItemIdStub({ value: '00000000-0000-4000-8000-000000000002' }),
              role: 'riftcarver',
              status: 'pending',
              spawnerType: 'command',
              relatedDataItems: ['operations/00000000-0000-4000-8000-000000000001'],
              dependsOn: [priorId],
              createdAt: '2024-01-15T10:00:00.000Z',
              step: 'carve',
            }),
          ],
        });
      },
    );
  });

  describe('intake plan items forced complete', () => {
    it('VALID: {chaoswhisperer op pending + glyphsmith op in_progress, codeweaver op pending} => both intake ops forced complete, the pre-existing codeweaver op stays first actionable, and the newly minted riftcarver scope seeds pending behind it', () => {
      const proxy = questBuildRelayGraphBrokerProxy();
      proxy.setupUuids({ ids: UUIDS });

      const forgottenPlanOp = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        role: 'chaoswhisperer',
        text: 'Author spec + implementation plan',
        status: 'pending',
      });
      const forgottenDesignOp = OperationItemStub({
        id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        role: 'glyphsmith',
        text: 'Design prototypes',
        status: 'in_progress',
      });
      const codeweaverOp = OperationItemStub({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        role: 'codeweaver',
        status: 'pending',
      });
      const quest = QuestStub({
        operations: [forgottenPlanOp, forgottenDesignOp, codeweaverOp],
      });

      const result = questBuildRelayGraphBroker({
        quest,
        priorWorkItemIds: [],
        now: IsoTimestampStub(),
      });

      expect(result).toStrictEqual({
        operations: [
          { ...forgottenPlanOp, status: 'complete' },
          { ...forgottenDesignOp, status: 'complete' },
          { ...codeweaverOp, status: 'in_progress' },
          OperationItemStub({
            id: '00000000-0000-4000-8000-000000000001',
            role: 'riftcarver',
            text: 'Riftcarver: carve the quest branch, worktree and preflight typecheck',
            status: 'pending',
            locked: true,
            packageNames: [],
          }),
        ],
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: '00000000-0000-4000-8000-000000000002' }),
            role: 'codeweaver',
            status: 'pending',
            spawnerType: 'agent',
            relatedDataItems: ['operations/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'],
            dependsOn: [],
            createdAt: '2024-01-15T10:00:00.000Z',
            step: 'carve',
          }),
        ],
      });
    });
  });

  describe('codeweaver dependency ordering', () => {
    it('VALID: {pre-existing codeweaver ops authored top-down with a packageGraph stamped} => the ledger comes back dependencies-first, the LEAF op is the one marked in_progress, and the newly minted riftcarver scope seeds pending behind both', () => {
      const proxy = questBuildRelayGraphBrokerProxy();
      proxy.setupUuids({ ids: UUIDS });

      const webOp = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        role: 'codeweaver',
        text: 'web: render the comment box',
        status: 'pending',
        packageNames: ['web'],
      });
      const serverOp = OperationItemStub({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        role: 'codeweaver',
        text: 'server: expose the comment route',
        status: 'pending',
        packageNames: ['server'],
      });
      const quest = QuestStub({
        operations: [webOp, serverOp],
        packageGraph: [
          PackageGraphEntryStub({
            id: 'server',
            dependsOn: [],
            depth: 0,
            packageType: 'http-backend',
            changeType: 'edit',
          }),
          PackageGraphEntryStub({
            id: 'web',
            dependsOn: ['server'],
            depth: 1,
            packageType: 'frontend-react',
            changeType: 'edit',
          }),
        ],
      });

      const result = questBuildRelayGraphBroker({
        quest,
        priorWorkItemIds: [],
        now: IsoTimestampStub(),
      });

      expect(result).toStrictEqual({
        operations: [
          { ...serverOp, status: 'in_progress' },
          webOp,
          OperationItemStub({
            id: '00000000-0000-4000-8000-000000000001',
            role: 'riftcarver',
            text: 'Riftcarver: carve the quest branch, worktree and preflight typecheck',
            status: 'pending',
            locked: true,
            packageNames: [],
          }),
        ],
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: '00000000-0000-4000-8000-000000000002' }),
            role: 'codeweaver',
            status: 'pending',
            spawnerType: 'agent',
            relatedDataItems: ['operations/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'],
            dependsOn: [],
            createdAt: '2024-01-15T10:00:00.000Z',
            step: 'carve',
          }),
        ],
      });
    });
  });
});
