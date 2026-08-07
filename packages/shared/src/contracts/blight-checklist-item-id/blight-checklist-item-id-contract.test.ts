import { blightChecklistItemIdContract } from './blight-checklist-item-id-contract';
import { BlightChecklistItemIdStub } from './blight-checklist-item-id.stub';

describe('blightChecklistItemIdContract', () => {
  describe('valid ids', () => {
    it('VALID: {impl path + concern} => parses', () => {
      expect(
        BlightChecklistItemIdStub({
          value: 'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:craft',
        }),
      ).toBe('packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:craft');
    });

    it('VALID: {deeply nested impl path} => parses', () => {
      expect(
        BlightChecklistItemIdStub({
          value: 'packages/orchestrator/src/brokers/quest/execute/quest-execute-broker.ts:perf',
        }),
      ).toBe('packages/orchestrator/src/brokers/quest/execute/quest-execute-broker.ts:perf');
    });
  });

  describe('determinism', () => {
    it('VALID: {same source segments parsed twice} => yields byte-identical ids, so a later session resumes against a prior ledger', () => {
      expect(blightChecklistItemIdContract.parse('packages/shared/src/index.ts:dedup')).toBe(
        blightChecklistItemIdContract.parse('packages/shared/src/index.ts:dedup'),
      );
    });
  });

  describe('invalid input', () => {
    it('EMPTY: {empty string} => throws', () => {
      expect(() => BlightChecklistItemIdStub({ value: '' })).toThrow(
        /String must contain at least 1 character/u,
      );
    });
  });
});
