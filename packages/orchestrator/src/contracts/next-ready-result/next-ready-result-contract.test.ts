import { QuestWorkItemIdStub, WorkItemStub } from '@dungeonmaster/shared/contracts';

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

      expect(result.questTerminal).toBe(false);
      expect(result.questBlocked).toBe(false);
    });
  });
});
