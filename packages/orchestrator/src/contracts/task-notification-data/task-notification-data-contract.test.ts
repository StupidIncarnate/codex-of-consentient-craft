import { taskNotificationDataContract } from './task-notification-data-contract';
import { TaskNotificationDataStub } from './task-notification-data.stub';

describe('taskNotificationDataContract', () => {
  describe('valid data', () => {
    it('VALID: {all fields} => parses with every structured field', () => {
      const data = TaskNotificationDataStub();

      const result = taskNotificationDataContract.parse(data);

      expect(result).toStrictEqual({
        taskId: 'acfc7f06a8ac21baf',
        status: 'completed',
        summary: 'Agent "MCP calls test - background sub-agent" completed',
        result: 'Made both MCP calls successfully.',
        totalTokens: 28054,
        toolUses: 3,
        durationMs: 9033,
      });
    });

    it('VALID: {minimal fields — taskId + status only} => parses and omits optionals', () => {
      const result = taskNotificationDataContract.parse({
        taskId: 'abc',
        status: 'running',
      });

      expect(result).toStrictEqual({
        taskId: 'abc',
        status: 'running',
      });
    });
  });

  describe('invalid data', () => {
    it('INVALID: {taskId empty} => throws validation error', () => {
      expect(() => {
        return taskNotificationDataContract.parse({ taskId: '', status: 'completed' });
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID: {status empty} => throws validation error', () => {
      expect(() => {
        return taskNotificationDataContract.parse({ taskId: 'abc', status: '' });
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID: {missing taskId} => throws validation error', () => {
      expect(() => {
        return taskNotificationDataContract.parse({ status: 'completed' });
      }).toThrow(/Required/u);
    });
  });
});
