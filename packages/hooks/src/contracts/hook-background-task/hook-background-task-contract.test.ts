import { hookBackgroundTaskContract } from './hook-background-task-contract';
import { HookBackgroundTaskStub } from './hook-background-task.stub';

describe('hookBackgroundTaskContract', () => {
  describe('valid tasks', () => {
    it('VALID: {id, type, status, description, command} => parses every field through', () => {
      const task = HookBackgroundTaskStub({});

      const result = hookBackgroundTaskContract.parse(task);

      expect(result).toStrictEqual({
        id: 'bcibjy15w',
        type: 'shell',
        status: 'running',
        description: 'Run full ward in background',
        command: 'npm run ward',
      });
    });

    it('VALID: {status: "completed"} => accepts a status no enum lists', () => {
      const task = HookBackgroundTaskStub({ status: 'completed' });

      const result = hookBackgroundTaskContract.parse(task);

      expect(result.status).toBe('completed');
    });

    it('VALID: {id, status only} => the two fields every captured event carried are enough', () => {
      const result = hookBackgroundTaskContract.parse({ id: 'bcibjy15w', status: 'running' });

      expect(result).toStrictEqual({ id: 'bcibjy15w', status: 'running' });
    });
  });

  describe('invalid tasks', () => {
    it('INVALID: {id: ""} => throws, because an unidentifiable task cannot be reported back', () => {
      expect(() => hookBackgroundTaskContract.parse({ id: '', status: 'running' })).toThrow(
        /at least 1 character/u,
      );
    });

    it('INVALID: {status: ""} => throws, because an empty status decides nothing', () => {
      expect(() => hookBackgroundTaskContract.parse({ id: 'bcibjy15w', status: '' })).toThrow(
        /at least 1 character/u,
      );
    });
  });
});
