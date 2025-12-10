import { calculateTaskProgressTransformer } from './calculate-task-progress-transformer';
import { QuestTaskStub } from '../../contracts/quest-task/quest-task.stub';

describe('calculateTaskProgressTransformer', () => {
  describe('valid progress', () => {
    it('VALID: {no tasks} => returns "0/0"', () => {
      const result = calculateTaskProgressTransformer({ tasks: [] });

      expect(result).toBe('0/0');
    });

    it('VALID: {all complete} => returns "3/3"', () => {
      const tasks = [
        QuestTaskStub({ status: 'complete' }),
        QuestTaskStub({ status: 'complete', id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
        QuestTaskStub({ status: 'complete', id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' }),
      ];

      const result = calculateTaskProgressTransformer({ tasks });

      expect(result).toBe('3/3');
    });

    it('VALID: {some complete} => returns "2/5"', () => {
      const tasks = [
        QuestTaskStub({ status: 'complete' }),
        QuestTaskStub({ status: 'complete', id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
        QuestTaskStub({ status: 'in_progress', id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' }),
        QuestTaskStub({ status: 'pending', id: 'c3d4e5f6-a7b8-9012-cdef-123456789012' }),
        QuestTaskStub({ status: 'pending', id: 'd4e5f6a7-b8c9-0123-def0-234567890123' }),
      ];

      const result = calculateTaskProgressTransformer({ tasks });

      expect(result).toBe('2/5');
    });

    it('VALID: {none complete} => returns "0/3"', () => {
      const tasks = [
        QuestTaskStub({ status: 'pending' }),
        QuestTaskStub({ status: 'in_progress', id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
        QuestTaskStub({ status: 'failed', id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' }),
      ];

      const result = calculateTaskProgressTransformer({ tasks });

      expect(result).toBe('0/3');
    });

    it('VALID: {failed and skipped not counted as complete} => returns "1/3"', () => {
      const tasks = [
        QuestTaskStub({ status: 'complete' }),
        QuestTaskStub({ status: 'failed', id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
        QuestTaskStub({ status: 'skipped', id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' }),
      ];

      const result = calculateTaskProgressTransformer({ tasks });

      expect(result).toBe('1/3');
    });
  });
});
