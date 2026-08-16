import { BlightChecklistStub } from '@dungeonmaster/shared/contracts';

import { blightCoverageOutstandingTransformer } from './blight-coverage-outstanding-transformer';

describe('blightCoverageOutstandingTransformer', () => {
  describe('surfaces that cannot be measured', () => {
    it('EMPTY: {checklist: null, meaning baseRef was never pinned} => returns empty, so a caller never wedges on a scope it cannot compute', () => {
      expect(blightCoverageOutstandingTransformer({ checklist: null })).toStrictEqual([]);
    });
  });

  describe('a measured checklist', () => {
    it('VALID: {remaining units on the checklist} => returns those ids', () => {
      const checklist = BlightChecklistStub({
        remainingItemIds: [
          'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:craft',
          'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:integrity',
        ],
      });

      expect(blightCoverageOutstandingTransformer({ checklist })).toStrictEqual([
        'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:craft',
        'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:integrity',
      ]);
    });

    it('VALID: {no remaining units} => returns empty, so every unit on that surface is dealt with', () => {
      const checklist = BlightChecklistStub({ remainingItemIds: [] });

      expect(blightCoverageOutstandingTransformer({ checklist })).toStrictEqual([]);
    });
  });
});
