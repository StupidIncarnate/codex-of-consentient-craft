import { displayHeaderQuestStatusTransformer } from './display-header-quest-status-transformer';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

const STATUSES = Object.keys(
  questStatusMetadataStatics.statuses,
) as readonly (keyof typeof questStatusMetadataStatics.statuses)[];

describe('displayHeaderQuestStatusTransformer', () => {
  describe('Fix 6 execution labels', () => {
    it('VALID: {status: in_progress} => returns IN PROGRESS', () => {
      const result = displayHeaderQuestStatusTransformer({ status: 'in_progress' });

      expect(result).toBe('IN PROGRESS');
    });

    it('VALID: {status: paused} => returns EXECUTION PAUSED', () => {
      const result = displayHeaderQuestStatusTransformer({ status: 'paused' });

      expect(result).toBe('EXECUTION PAUSED');
    });

    it('VALID: {status: blocked} => returns EXECUTION BLOCKED', () => {
      const result = displayHeaderQuestStatusTransformer({ status: 'blocked' });

      expect(result).toBe('EXECUTION BLOCKED');
    });

    it('VALID: {status: complete} => returns EXECUTION COMPLETE', () => {
      const result = displayHeaderQuestStatusTransformer({ status: 'complete' });

      expect(result).toBe('EXECUTION COMPLETE');
    });

    it('VALID: {status: abandoned} => returns ABANDONED', () => {
      const result = displayHeaderQuestStatusTransformer({ status: 'abandoned' });

      expect(result).toBe('ABANDONED');
    });
  });

  describe('state matrix — delegates to metadata', () => {
    it.each(STATUSES)('VALID: {status: %s} => matches metadata.displayHeader', (status) => {
      const expected = questStatusMetadataStatics.statuses[status].displayHeader;

      const result = displayHeaderQuestStatusTransformer({ status });

      expect(result).toBe(expected);
    });
  });
});
