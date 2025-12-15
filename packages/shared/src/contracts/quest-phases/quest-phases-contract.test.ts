import { questPhasesContract } from './quest-phases-contract';
import { QuestPhasesStub } from './quest-phases.stub';

describe('questPhasesContract', () => {
  describe('valid phases', () => {
    it('VALID: all pending phases => parses successfully', () => {
      const phases = QuestPhasesStub();

      const result = questPhasesContract.parse(phases);

      expect(result.discovery.status).toBe('pending');
      expect(result.implementation.status).toBe('pending');
      expect(result.testing.status).toBe('pending');
      expect(result.review.status).toBe('pending');
    });

    it('VALID: mixed status phases => parses successfully', () => {
      const phases = QuestPhasesStub({
        discovery: { status: 'complete' },
        implementation: { status: 'in_progress' },
      });

      const result = questPhasesContract.parse(phases);

      expect(result.discovery.status).toBe('complete');
      expect(result.implementation.status).toBe('in_progress');
    });
  });

  describe('invalid phases', () => {
    it('INVALID: missing phases => throws validation error', () => {
      expect(() => {
        questPhasesContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
