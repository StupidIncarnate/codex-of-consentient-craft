import { hasRunningBackgroundTaskGuard } from './has-running-background-task-guard';
import { HookBackgroundTaskStub } from '../../contracts/hook-background-task/hook-background-task.stub';

describe('hasRunningBackgroundTaskGuard', () => {
  describe('a command still in flight', () => {
    it('VALID: {one running shell task} => returns true', () => {
      const backgroundTasks = [HookBackgroundTaskStub({ type: 'shell', status: 'running' })];

      expect(hasRunningBackgroundTaskGuard({ backgroundTasks })).toBe(true);
    });

    it('VALID: {one completed and one running shell task} => returns true', () => {
      const backgroundTasks = [
        HookBackgroundTaskStub({ id: 'done-1', type: 'shell', status: 'completed' }),
        HookBackgroundTaskStub({ id: 'live-1', type: 'shell', status: 'running' }),
      ];

      expect(hasRunningBackgroundTaskGuard({ backgroundTasks })).toBe(true);
    });
  });

  describe('nothing a stop would destroy', () => {
    it('VALID: {every shell task completed} => returns false', () => {
      const backgroundTasks = [
        HookBackgroundTaskStub({ id: 'done-1', type: 'shell', status: 'completed' }),
        HookBackgroundTaskStub({ id: 'done-2', type: 'shell', status: 'failed' }),
      ];

      expect(hasRunningBackgroundTaskGuard({ backgroundTasks })).toBe(false);
    });

    // THE DEADLOCK THIS GUARD MUST NOT REPRODUCE. An event lists the stopping agent ITSELF as a
    // running `subagent` task whose id equals the event's own `agent_id`, so a check on `status`
    // alone blocks every async-dispatched sub-agent on an entry nothing it can do will clear.
    it('VALID: {running subagent task} => returns false, because that entry is the agent itself', () => {
      const backgroundTasks = [
        HookBackgroundTaskStub({ id: 'a4a98a1e1fbe45b1c', type: 'subagent', status: 'running' }),
      ];

      expect(hasRunningBackgroundTaskGuard({ backgroundTasks })).toBe(false);
    });

    it('VALID: {running subagent beside a completed shell} => returns false', () => {
      const backgroundTasks = [
        HookBackgroundTaskStub({ id: 'agent-1', type: 'subagent', status: 'running' }),
        HookBackgroundTaskStub({ id: 'done-1', type: 'shell', status: 'completed' }),
      ];

      expect(hasRunningBackgroundTaskGuard({ backgroundTasks })).toBe(false);
    });

    it('VALID: {running task with no type} => returns false, so an unrecognised entry cannot wedge a session', () => {
      const backgroundTasks = [HookBackgroundTaskStub({ status: 'running', type: undefined })];

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
