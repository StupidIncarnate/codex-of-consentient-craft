import { questStatusContract } from './quest-status-contract';
import { QuestStatusStub } from './quest-status.stub';

describe('questStatusContract', () => {
  describe('valid statuses', () => {
    it('VALID: created => parses successfully', () => {
      const status = QuestStatusStub({ value: 'created' });

      const result = questStatusContract.parse(status);

      expect(result).toBe('created');
    });

    it('VALID: requirements_approved => parses successfully', () => {
      const status = QuestStatusStub({ value: 'requirements_approved' });

      const result = questStatusContract.parse(status);

      expect(result).toBe('requirements_approved');
    });

    it('VALID: approved => parses successfully', () => {
      const status = QuestStatusStub({ value: 'approved' });

      const result = questStatusContract.parse(status);

      expect(result).toBe('approved');
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
  });
});
