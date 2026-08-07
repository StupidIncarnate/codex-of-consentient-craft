import { BlightChecklistStub, OperationItemStub } from '@dungeonmaster/shared/contracts';

import { blightCoverageOutstandingTransformer } from './blight-coverage-outstanding-transformer';

describe('blightCoverageOutstandingTransformer', () => {
  describe('items the gate does not bind', () => {
    it('VALID: {non-blightwarden role} => never gated', () => {
      const checklist = BlightChecklistStub({
        remainingItemIds: ['packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:coverage'],
      });

      expect(
        blightCoverageOutstandingTransformer({
          operationItem: OperationItemStub({ role: 'siegemaster' }),
          checklist,
        }),
      ).toStrictEqual([]);
    });

    it('EMPTY: {checklist: null, meaning baseRef was never pinned} => not gated, so the quest never wedges', () => {
      expect(
        blightCoverageOutstandingTransformer({
          operationItem: OperationItemStub({ role: 'blightwarden' }),
          checklist: null,
        }),
      ).toStrictEqual([]);
    });
  });

  describe('blightwarden items with a measured checklist', () => {
    it('VALID: {remaining units on the checklist} => returns those ids', () => {
      const checklist = BlightChecklistStub({
        remainingItemIds: [
          'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:craft',
          'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:integrity',
        ],
      });

      expect(
        blightCoverageOutstandingTransformer({
          operationItem: OperationItemStub({ role: 'blightwarden' }),
          checklist,
        }),
      ).toStrictEqual([
        'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:craft',
        'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:integrity',
      ]);
    });

    it('VALID: {no remaining units} => returns empty, so done is allowed', () => {
      const checklist = BlightChecklistStub({ remainingItemIds: [] });

      expect(
        blightCoverageOutstandingTransformer({
          operationItem: OperationItemStub({ role: 'blightwarden' }),
          checklist,
        }),
      ).toStrictEqual([]);
    });
  });
});
