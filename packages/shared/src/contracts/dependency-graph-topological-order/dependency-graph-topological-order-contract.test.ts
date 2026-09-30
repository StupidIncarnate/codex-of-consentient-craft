import { DependencyGraphTopologicalOrderStub } from './dependency-graph-topological-order.stub';
import { dependencyGraphTopologicalOrderContract } from './dependency-graph-topological-order-contract';

describe('dependencyGraphTopologicalOrderContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = DependencyGraphTopologicalOrderStub();

      expect(dependencyGraphTopologicalOrderContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {order: wrong type} => throws', () => {
      expect(() =>
        dependencyGraphTopologicalOrderContract.parse({
          ...DependencyGraphTopologicalOrderStub(),
          order: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
