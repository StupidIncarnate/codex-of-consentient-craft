import { QuestStub } from '@dungeonmaster/shared/contracts';
import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';

import { isDesignStartVisibleGuard } from './is-design-start-visible-guard';

const STATUSES = Object.keys(
  questStatusMetadataStatics.statuses,
) as readonly (keyof typeof questStatusMetadataStatics.statuses)[];

const DESIGN_START_VISIBLE_STATUSES: ReadonlySet<keyof typeof questStatusMetadataStatics.statuses> =
  new Set(['approved', 'design_approved']);

describe('isDesignStartVisibleGuard', () => {
  describe('state matrix with needsDesign true', () => {
    it.each(STATUSES)(
      'VALID: {status: %s, needsDesign: true} => returns expected flag',
      (status) => {
        const expected = DESIGN_START_VISIBLE_STATUSES.has(status);
        const quest = QuestStub({ status, needsDesign: true });

        const result = isDesignStartVisibleGuard({ quest });

        expect(result).toBe(expected);
      },
    );
  });

  describe('state matrix with needsDesign false', () => {
    it.each(STATUSES)('VALID: {status: %s, needsDesign: false} => returns false', (status) => {
      const quest = QuestStub({ status, needsDesign: false });

      const result = isDesignStartVisibleGuard({ quest });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {quest undefined} => returns false', () => {
      const result = isDesignStartVisibleGuard({});

      expect(result).toBe(false);
    });
  });
});
