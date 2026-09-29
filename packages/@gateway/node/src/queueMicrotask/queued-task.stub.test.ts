import { QueuedTaskStub } from './queued-task.stub';

describe('QueuedTaskStub', () => {
  it('EMPTY: {callback never invoked} => hasRun is false', () => {
    const task = QueuedTaskStub();

    expect(task.hasRun()).toBe(false);
  });

  it('VALID: {callback invoked} => hasRun is true', () => {
    const task = QueuedTaskStub();

    task.callback();

    expect(task.hasRun()).toBe(true);
  });

  it('VALID: {two stubs} => each tracks its own callback', () => {
    const first = QueuedTaskStub();
    const second = QueuedTaskStub();

    first.callback();

    expect({ first: first.hasRun(), second: second.hasRun() }).toStrictEqual({
      first: true,
      second: false,
    });
  });
});
