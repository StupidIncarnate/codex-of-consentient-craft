import { loadBalancerStatics } from './load-balancer-statics';

describe('loadBalancerStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(loadBalancerStatics).toStrictEqual({
      packageName: 'load-balancer',
    });
  });
});
