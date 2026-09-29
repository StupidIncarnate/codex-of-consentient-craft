import { QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts/quest-work-item-id/quest-work-item-id.stub';
import { WorkItemStub } from '@dungeonmaster/shared/contracts/work-item/work-item.stub';

import { nextReadyResultContract } from './next-ready-result-contract';
import { NextReadyResultStub } from './next-ready-result.stub';

describe('nextReadyResultContract', () => {
  describe('valid results', () => {
    it('VALID: {empty ready, terminal} => parses successfully', () => {
      const result = NextReadyResultStub({ questTerminal: true });

      expect(result).toStrictEqual({
        ready: [],
        questTerminal: true,
        questBlocked: false,
      });
    });

    it('VALID: {ready items, not terminal} => parses with items', () => {
      const item = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
      });

      const result = nextReadyResultContract.parse({
        ready: [item],
        questTerminal: false,
        questBlocked: false,
      });

      expect(result).toStrictEqual({
        ready: [item],
        questTerminal: false,
        questBlocked: false,
      });
    });
  });
});
