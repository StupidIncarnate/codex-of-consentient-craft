import { siegeInstanceContract } from './siege-instance-contract';
import { SiegeInstanceStub } from './siege-instance.stub';

describe('siegeInstanceContract', () => {
  it('VALID: {default stub} => parses with the default id', () => {
    const value = SiegeInstanceStub();

    expect(value.id).toBe('inst_7f3a9c21');
  });

  it('INVALID: {id: ""} => is rejected', () => {
    const result = siegeInstanceContract.safeParse({ id: '' });

    expect(result.success).toBe(false);
  });
});
