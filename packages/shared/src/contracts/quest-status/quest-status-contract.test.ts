import { questStatusContract } from './quest-status-contract';
import { QuestStatusStub } from './quest-status.stub';

describe('questStatusContract', () => {
  describe('valid statuses', () => {
    it('VALID: created => parses successfully', () => {
      const status = QuestStatusStub({ value: 'created' });

      const result = questStatusContract.parse(status);

      expect(result).toBe('created');
    });

    it('VALID: explore_flows => parses successfully', () => {
      const status = QuestStatusStub({ value: 'explore_flows' });

      const result = questStatusContract.parse(status);

      expect(result).toBe('explore_flows');
    });

    it('VALID: review_flows => parses successfully', () => {
      const status = QuestStatusStub({ value: 'review_flows' });

      const result = questStatusContract.parse(status);

      expect(result).toBe('review_flows');
    });

    it('VALID: flows_approved => parses successfully', () => {
      const status = QuestStatusStub({ value: 'flows_approved' });

      const result = questStatusContract.parse(status);

      expect(result).toBe('flows_approved');
    });

    it('VALID: explore_observables => parses successfully', () => {
      const status = QuestStatusStub({ value: 'explore_observables' });

      const result = questStatusContract.parse(status);

      expect(result).toBe('explore_observables');
    });

    it('VALID: review_observables => parses successfully', () => {
      const status = QuestStatusStub({ value: 'review_observables' });

      const result = questStatusContract.parse(status);

      expect(result).toBe('review_observables');
    });

    it('VALID: approved => parses successfully', () => {
      const status = QuestStatusStub({ value: 'approved' });

      const result = questStatusContract.parse(status);

      expect(result).toBe('approved');
    });

    it('VALID: explore_design => parses successfully', () => {
      const status = QuestStatusStub({ value: 'explore_design' });

      const result = questStatusContract.parse(status);

      expect(result).toBe('explore_design');
    });

    it('VALID: review_design => parses successfully', () => {
      const status = QuestStatusStub({ value: 'review_design' });

      const result = questStatusContract.parse(status);

      expect(result).toBe('review_design');
    });

    it('VALID: design_approved => parses successfully', () => {
      const status = QuestStatusStub({ value: 'design_approved' });

      const result = questStatusContract.parse(status);

      expect(result).toBe('design_approved');
    });

    it('VALID: pending => parses successfully', () => {
      const status = QuestStatusStub({ value: 'pending' });

      const result = questStatusContract.parse(status);

      expect(result).toBe('pending');
    });

    it('VALID: in_progress => parses successfully', () => {
      const status = QuestStatusStub({ value: 'in_progress' });

      const result = questStatusContract.parse(status);

      expect(result).toBe('in_progress');
    });

    it('VALID: paused => parses successfully', () => {
      const status = QuestStatusStub({ value: 'paused' });

      const result = questStatusContract.parse(status);

      expect(result).toBe('paused');
    });

    it('VALID: blocked => parses successfully', () => {
      const status = QuestStatusStub({ value: 'blocked' });

      const result = questStatusContract.parse(status);

      expect(result).toBe('blocked');
    });

    it('VALID: complete => parses successfully', () => {
      const status = QuestStatusStub({ value: 'complete' });

      const result = questStatusContract.parse(status);

      expect(result).toBe('complete');
    });

    it('VALID: abandoned => parses successfully', () => {
      const status = QuestStatusStub({ value: 'abandoned' });

      const result = questStatusContract.parse(status);

      expect(result).toBe('abandoned');
    });
  });

  describe('invalid statuses', () => {
    it('INVALID: unknown status => throws validation error', () => {
      expect(() => {
        questStatusContract.parse('invalid_status');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: requirements_approved => throws validation error (removed status)', () => {
      expect(() => {
        questStatusContract.parse('requirements_approved');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
