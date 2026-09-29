/**
 * PURPOSE: A callback that records whether it ran, paired with a reader for that fact — for a test
 * that queues work and needs to observe it without a hand-rolled flag.
 *
 * USAGE:
 * const task = QueuedTaskStub();
 * queueMicrotask(task.callback);
 * await Promise.resolve();
 * task.hasRun(); // true
 */

export const QueuedTaskStub = (): { callback: () => void; hasRun: () => boolean } => {
  const state = { ran: false };

  return {
    callback: (): void => {
      state.ran = true;
    },
    hasRun: (): boolean => state.ran,
  };
};
