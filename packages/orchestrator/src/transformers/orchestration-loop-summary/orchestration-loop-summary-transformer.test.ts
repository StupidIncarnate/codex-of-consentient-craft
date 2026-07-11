import { QuestIdStub, QuestWorkItemIdStub, WorkItemStub } from '@dungeonmaster/shared/contracts';

import { OrchestrationLoopSummaryStub } from '../../contracts/orchestration-loop-summary/orchestration-loop-summary.stub';
import { orchestrationLoopSummaryTransformer } from './orchestration-loop-summary-transformer';

describe('orchestrationLoopSummaryTransformer', () => {
  describe('pick order + buckets', () => {
    it('VALID: {ready x2 exec, running, waiting, done} => numbered ready first, then running/waiting/done', () => {
      const chaosId = QuestWorkItemIdStub({ value: '11111111-1111-4111-8111-111111111111' });
      const cw1Id = QuestWorkItemIdStub({ value: '22222222-2222-4222-8222-222222222222' });
      const cw2Id = QuestWorkItemIdStub({ value: '33333333-3333-4333-8333-333333333333' });
      const cwRunId = QuestWorkItemIdStub({ value: '44444444-4444-4444-8444-444444444444' });
      const wardId = QuestWorkItemIdStub({ value: '55555555-5555-4555-8555-555555555555' });

      const chaos = WorkItemStub({ id: chaosId, role: 'chaoswhisperer', status: 'complete' });
      const cw1 = WorkItemStub({
        id: cw1Id,
        role: 'codeweaver',
        status: 'pending',
        dependsOn: [chaosId],
      });
      const cw2 = WorkItemStub({
        id: cw2Id,
        role: 'codeweaver',
        status: 'pending',
        dependsOn: [chaosId],
      });
      const cwRun = WorkItemStub({
        id: cwRunId,
        role: 'codeweaver',
        status: 'in_progress',
        dependsOn: [chaosId],
      });
      const ward = WorkItemStub({
        id: wardId,
        role: 'ward',
        status: 'pending',
        dependsOn: [cw1Id, cw2Id, cwRunId],
      });

      const result = orchestrationLoopSummaryTransformer({
        questId: QuestIdStub({ value: 'demo-quest' }),
        questStatus: 'in_progress',
        workItems: [chaos, cw1, cw2, cwRun, ward],
        ready: [cw1, cw2],
        chatRoles: [chaos.role],
      });

      const expected = [
        '[orchestration-loop] quest=demo-quest status=in_progress items=5 (ready=2 running=1 waiting=1 done=1 failed=0 skipped=0)',
        '  queue (pick order - ready first, then running, waiting, done):',
        '    #1  READY codeweaver      22222222-2222-4222-8222-222222222222  [exec]',
        '    #2  READY codeweaver      33333333-3333-4333-8333-333333333333  [exec]',
        '        RUN   codeweaver      44444444-4444-4444-8444-444444444444',
        '        WAIT  ward            55555555-5555-4555-8555-555555555555  waiting on: codeweaver x3',
        '        DONE  chaoswhisperer  11111111-1111-4111-8111-111111111111',
      ].join('\n');

      expect(result).toBe(OrchestrationLoopSummaryStub({ value: expected }));
    });
  });

  describe('ready chat annotation', () => {
    it('VALID: {ready chat-role item} => annotated [chat]', () => {
      const chaosId = QuestWorkItemIdStub({ value: '12121212-1212-4121-8121-121212121212' });
      const chaos = WorkItemStub({ id: chaosId, role: 'chaoswhisperer', status: 'pending' });

      const result = orchestrationLoopSummaryTransformer({
        questId: QuestIdStub({ value: 'demo-quest' }),
        questStatus: 'in_progress',
        workItems: [chaos],
        ready: [chaos],
        chatRoles: [chaos.role],
      });

      const expected = [
        '[orchestration-loop] quest=demo-quest status=in_progress items=1 (ready=1 running=0 waiting=0 done=0 failed=0 skipped=0)',
        '  queue (pick order - ready first, then running, waiting, done):',
        '    #1  READY chaoswhisperer  12121212-1212-4121-8121-121212121212  [chat]',
      ].join('\n');

      expect(result).toBe(OrchestrationLoopSummaryStub({ value: expected }));
    });
  });

  describe('terminal buckets', () => {
    it('VALID: {failed + skipped items} => FAIL before SKIP with counts', () => {
      const failedId = QuestWorkItemIdStub({ value: 'ffffffff-ffff-4fff-8fff-ffffffffffff' });
      const skippedId = QuestWorkItemIdStub({ value: '99999999-9999-4999-8999-999999999999' });
      const failedCw = WorkItemStub({ id: failedId, role: 'codeweaver', status: 'failed' });
      const skippedWard = WorkItemStub({ id: skippedId, role: 'ward', status: 'skipped' });

      const result = orchestrationLoopSummaryTransformer({
        questId: QuestIdStub({ value: 'demo-quest' }),
        questStatus: 'in_progress',
        workItems: [failedCw, skippedWard],
        ready: [],
        chatRoles: [],
      });

      const expected = [
        '[orchestration-loop] quest=demo-quest status=in_progress items=2 (ready=0 running=0 waiting=0 done=0 failed=1 skipped=1)',
        '  queue (pick order - ready first, then running, waiting, done):',
        '        FAIL  codeweaver      ffffffff-ffff-4fff-8fff-ffffffffffff',
        '        SKIP  ward            99999999-9999-4999-8999-999999999999',
      ].join('\n');

      expect(result).toBe(OrchestrationLoopSummaryStub({ value: expected }));
    });
  });

  describe('waiting reasons', () => {
    it('VALID: {waiting items} => renders empty-dep, distinct-role, and unknown-dep reasons', () => {
      const depCwId = QuestWorkItemIdStub({ value: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' });
      const depWardId = QuestWorkItemIdStub({ value: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' });
      const waiterId = QuestWorkItemIdStub({ value: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' });
      const orphanId = QuestWorkItemIdStub({ value: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' });
      const missingId = QuestWorkItemIdStub({ value: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee' });

      const depCw = WorkItemStub({ id: depCwId, role: 'codeweaver', status: 'pending' });
      const depWard = WorkItemStub({ id: depWardId, role: 'ward', status: 'pending' });
      const waiter = WorkItemStub({
        id: waiterId,
        role: 'siegemaster',
        status: 'pending',
        dependsOn: [depCwId, depWardId],
      });
      const orphan = WorkItemStub({
        id: orphanId,
        role: 'lawbringer',
        status: 'pending',
        dependsOn: [missingId],
      });

      const result = orchestrationLoopSummaryTransformer({
        questId: QuestIdStub({ value: 'demo-quest' }),
        questStatus: 'in_progress',
        workItems: [depCw, depWard, waiter, orphan],
        ready: [],
        chatRoles: [],
      });

      const expected = [
        '[orchestration-loop] quest=demo-quest status=in_progress items=4 (ready=0 running=0 waiting=4 done=0 failed=0 skipped=0)',
        '  queue (pick order - ready first, then running, waiting, done):',
        '        WAIT  codeweaver      aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa  waiting',
        '        WAIT  ward            bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb  waiting',
        '        WAIT  siegemaster     cccccccc-cccc-4ccc-8ccc-cccccccccccc  waiting on: codeweaver, ward',
        '        WAIT  lawbringer      dddddddd-dddd-4ddd-8ddd-dddddddddddd  waiting on: unknown',
      ].join('\n');

      expect(result).toBe(OrchestrationLoopSummaryStub({ value: expected }));
    });
  });

  describe('empty queue', () => {
    it('EMPTY: {workItems: []} => header only, no queue section', () => {
      const result = orchestrationLoopSummaryTransformer({
        questId: QuestIdStub({ value: 'demo-quest' }),
        questStatus: 'in_progress',
        workItems: [],
        ready: [],
        chatRoles: [],
      });

      expect(result).toBe(
        OrchestrationLoopSummaryStub({
          value:
            '[orchestration-loop] quest=demo-quest status=in_progress items=0 (ready=0 running=0 waiting=0 done=0 failed=0 skipped=0)',
        }),
      );
    });
  });
});
