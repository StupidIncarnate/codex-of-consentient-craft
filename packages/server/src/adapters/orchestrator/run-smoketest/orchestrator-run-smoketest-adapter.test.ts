import { orchestratorRunSmoketestAdapter } from './orchestrator-run-smoketest-adapter';

describe('orchestratorRunSmoketestAdapter', () => {
  it('VALID: {export signature} => arity (length) is 1 (one positional object param)', () => {
    expect([orchestratorRunSmoketestAdapter.length]).toStrictEqual([1]);
  });
});
