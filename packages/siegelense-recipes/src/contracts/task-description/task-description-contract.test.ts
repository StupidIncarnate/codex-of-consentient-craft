import { taskDescriptionContract } from './task-description-contract';
import { TaskDescriptionStub } from './task-description.stub';

describe('taskDescriptionContract', () => {
  describe('valid task descriptions', () => {
    it('VALID: {value: "Seeded task 1"} => parses to "Seeded task 1"', () => {
      const result = taskDescriptionContract.parse('Seeded task 1');

      expect(result).toBe('Seeded task 1');
    });

    it('VALID: {stub} => parses to "Seeded task 1"', () => {
      const result = TaskDescriptionStub();

      expect(result).toBe('Seeded task 1');
    });
  });

  describe('invalid task descriptions', () => {
    it('INVALID: {value: ""} => throws too_small', () => {
      expect(() => taskDescriptionContract.parse('')).toThrow(/too_small/u);
    });
  });
});
