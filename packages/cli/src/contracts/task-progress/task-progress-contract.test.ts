import { taskProgressContract } from './task-progress-contract';
import { TaskProgressStub } from './task-progress.stub';

describe('taskProgressContract', () => {
  describe('valid progress', () => {
    it('VALID: "0/0" => parses successfully', () => {
      const progress = TaskProgressStub({ value: '0/0' });

      const result = taskProgressContract.parse(progress);

      expect(result).toBe('0/0');
    });

    it('VALID: "2/5" => parses successfully', () => {
      const progress = TaskProgressStub({ value: '2/5' });

      const result = taskProgressContract.parse(progress);

      expect(result).toBe('2/5');
    });

    it('VALID: "10/10" => parses successfully', () => {
      const progress = TaskProgressStub({ value: '10/10' });

      const result = taskProgressContract.parse(progress);

      expect(result).toBe('10/10');
    });
  });
});
