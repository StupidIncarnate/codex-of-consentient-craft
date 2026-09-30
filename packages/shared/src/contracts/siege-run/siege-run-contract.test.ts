import { siegeRunContract } from './siege-run-contract';
import { SiegeRunStub } from './siege-run.stub';

describe('siegeRunContract', () => {
  it('VALID: {default stub} => parses with the default id', () => {
    const value = SiegeRunStub();

    expect(value.id).toBe('run_1');
  });

  it('INVALID: {id: ""} => is rejected', () => {
    const result = siegeRunContract.safeParse({ id: '' });

    expect(result.success).toBe(false);
  });
});
