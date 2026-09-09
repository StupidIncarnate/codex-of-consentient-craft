import { hasRunningBackgroundTaskGuard } from './has-running-background-task-guard';
import { HookBackgroundTaskStub } from '../../contracts/hook-background-task/hook-background-task.stub';

describe('hasRunningBackgroundTaskGuard', () => {
  describe('work still in flight', () => {
    it('VALID: {one running task} => returns true', () => {
      const backgroundTasks = [HookBackgroundTaskStub({ status: 'running' })];

      expect(hasRunningBackgroundTaskGuard({ backgroundTasks })).toBe(true);
    });

    it('VALID: {one completed and one running} => returns true', () => {
      const backgroundTasks = [
        HookBackgroundTaskStub({ id: 'done-1', status: 'completed' }),
        HookBackgroundTaskStub({ id: 'live-1', status: 'running' }),
      ];

      expect(hasRunningBackgroundTaskGuard({ backgroundTasks })).toBe(true);
    });
  });

  describe('nothing in flight', () => {
    it('VALID: {every task completed} => returns false', () => {
      const backgroundTasks = [
        HookBackgroundTaskStub({ id: 'done-1', status: 'completed' }),
        HookBackgroundTaskStub({ id: 'done-2', status: 'failed' }),
      ];

      expect(hasRunningBackgroundTaskGuard({ backgroundTasks })).toBe(false);
    });

    it('EMPTY: {backgroundTasks: []} => returns false', () => {
      expect(hasRunningBackgroundTaskGuard({ backgroundTasks: [] })).toBe(false);
    });

    it('EMPTY: {backgroundTasks: undefined} => returns false, so an event without the field allows the stop', () => {
      expect(hasRunningBackgroundTaskGuard({})).toBe(false);
    });
  });
});
