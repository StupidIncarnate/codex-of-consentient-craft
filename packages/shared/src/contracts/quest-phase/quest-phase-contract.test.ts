import { questPhaseContract } from './quest-phase-contract';
import { QuestPhaseStub } from './quest-phase.stub';

describe('questPhaseContract', () => {
  describe('valid quest phases', () => {
    it('VALID: minimal phase with status only => parses successfully', () => {
      const phase = QuestPhaseStub({ status: 'pending' });

      const result = questPhaseContract.parse(phase);

      expect(result).toStrictEqual({
        status: 'pending',
      });
    });

    it('VALID: phase with all fields => parses successfully', () => {
      const phase = QuestPhaseStub({
        status: 'complete',
        report: '001-pathseeker-report.json',
        progress: '3/5',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T12:00:00.000Z',
      });

      const result = questPhaseContract.parse(phase);

      expect(result).toStrictEqual({
        status: 'complete',
        report: '001-pathseeker-report.json',
        progress: '3/5',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T12:00:00.000Z',
      });
    });

    it('VALID: in_progress phase => parses successfully', () => {
      const phase = QuestPhaseStub({
        status: 'in_progress',
        startedAt: '2024-01-15T10:00:00.000Z',
      });

      const result = questPhaseContract.parse(phase);

      expect(result.status).toBe('in_progress');
      expect(result.startedAt).toBe('2024-01-15T10:00:00.000Z');
    });
  });

  describe('invalid quest phases', () => {
    it('INVALID: missing status => throws validation error', () => {
      expect(() => {
        questPhaseContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID: invalid status => throws validation error', () => {
      expect(() => {
        questPhaseContract.parse({ status: 'invalid' });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: invalid timestamp format => throws validation error', () => {
      expect(() => {
        questPhaseContract.parse({
          status: 'pending',
          startedAt: 'not-a-timestamp',
        });
      }).toThrow(/Invalid datetime/u);
    });
  });
});
