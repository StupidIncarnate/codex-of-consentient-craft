import { reconcileWatchersResultContract } from './reconcile-watchers-result-contract';
import { ReconcileWatchersResultStub } from './reconcile-watchers-result.stub';

describe('reconcileWatchersResultContract', () => {
  it('VALID: {started, stopped both nonneg ints} => parses', () => {
    const result = reconcileWatchersResultContract.parse(
      ReconcileWatchersResultStub({ started: 3, stopped: 1 }),
    );

    expect(result).toStrictEqual(ReconcileWatchersResultStub({ started: 3, stopped: 1 }));
  });

  it('VALID: {default stub} => started=0 stopped=0', () => {
    const result = ReconcileWatchersResultStub();

    expect(result).toStrictEqual({ started: 0, stopped: 0 });
  });

  it('ERROR: {negative started} => throws', () => {
    expect(() => reconcileWatchersResultContract.parse({ started: -1, stopped: 0 })).toThrow(
      /Number must be greater than or equal to 0/u,
    );
  });

  it('ERROR: {non-integer stopped} => throws', () => {
    expect(() => reconcileWatchersResultContract.parse({ started: 0, stopped: 1.5 })).toThrow(
      /Expected integer/u,
    );
  });
});
