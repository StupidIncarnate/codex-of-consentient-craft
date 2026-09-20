import { routePlanContract } from './route-plan-contract';
import { RoutePlanStub } from './route-plan.stub';

describe('routePlanContract', () => {
  describe('a plan with one route per ingredient', () => {
    it('VALID: {guild: write, quest: api} => returns both entries', () => {
      const result = routePlanContract.parse(RoutePlanStub({ guild: 'write', quest: 'api' }));

      expect(result).toStrictEqual({ guild: 'write', quest: 'api' });
    });
  });

  describe('a plan naming no ingredients yet', () => {
    it('EMPTY: {} => returns an empty route plan', () => {
      const result = routePlanContract.parse({});

      expect(result).toStrictEqual({});
    });
  });

  describe('a route this contract does not recognise', () => {
    it('INVALID: {guild: "socket"} => throws naming the valid routes', () => {
      expect(() => routePlanContract.parse({ guild: 'socket' })).toThrow(
        /Invalid enum value\. Expected 'api' \| 'write' \| 'recording', received 'socket'/u,
      );
    });
  });
});
