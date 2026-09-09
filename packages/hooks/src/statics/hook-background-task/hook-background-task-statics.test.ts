import { hookBackgroundTaskStatics } from './hook-background-task-statics';

describe('hookBackgroundTaskStatics', () => {
  it('VALID: exported object => carries the exact status and type Claude Code reports', () => {
    expect(hookBackgroundTaskStatics).toStrictEqual({
      status: { running: 'running' },
      type: { shell: 'shell' },
    });
  });
});
