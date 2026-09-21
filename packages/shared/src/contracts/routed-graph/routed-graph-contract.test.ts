import { routedGraphContract } from './routed-graph-contract';
import { RoutedGraphStub } from './routed-graph.stub';

describe('routedGraphContract', () => {
  describe('valid graphs', () => {
    it('VALID: {graphName, entry, nodes} => parses successfully', () => {
      const graph = RoutedGraphStub();

      const result = routedGraphContract.parse(graph);

      expect(result).toStrictEqual({
        graphName: 'codeweaver',
        entry: 'plan',
        nodes: { plan: { routes: { done: '@done' }, maxVisits: 5 } },
      });
    });

    it('VALID: {routes with a non-outcome-word key} => parses successfully, key intact', () => {
      const graph = RoutedGraphStub({
        nodes: { plan: { routes: { pass: 'work' } } },
      });

      const result = routedGraphContract.parse(graph);

      expect(result).toStrictEqual({
        graphName: 'codeweaver',
        entry: 'plan',
        nodes: { plan: { routes: { pass: 'work' } } },
      });
    });

    it('VALID: {nodes: {}} => parses an empty node set', () => {
      const graph = RoutedGraphStub({ nodes: {} });

      const result = routedGraphContract.parse(graph);

      expect(result).toStrictEqual({ graphName: 'codeweaver', entry: 'plan', nodes: {} });
    });

    it('VALID: {node with mintableOnRequest, no maxVisits} => parses successfully', () => {
      const graph = RoutedGraphStub({
        nodes: { recipe: { routes: { wall: '@blocked' }, mintableOnRequest: true } },
      });

      const result = routedGraphContract.parse(graph);

      expect(result).toStrictEqual({
        graphName: 'codeweaver',
        entry: 'plan',
        nodes: { recipe: { routes: { wall: '@blocked' }, mintableOnRequest: true } },
      });
    });
  });

  describe('invalid graphs', () => {
    it('INVALID: {graphName: ""} => throws validation error', () => {
      expect(() => routedGraphContract.parse({ graphName: '', entry: 'plan', nodes: {} })).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('INVALID: {entry: ""} => throws validation error', () => {
      expect(() =>
        routedGraphContract.parse({ graphName: 'codeweaver', entry: '', nodes: {} }),
      ).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID: {missing nodes} => throws validation error', () => {
      expect(() => routedGraphContract.parse({ graphName: 'codeweaver', entry: 'plan' })).toThrow(
        /Required/u,
      );
    });

    it('INVALID: {maxVisits: 0} => throws validation error', () => {
      expect(() =>
        routedGraphContract.parse({
          graphName: 'codeweaver',
          entry: 'plan',
          nodes: { plan: { routes: {}, maxVisits: 0 } },
        }),
      ).toThrow(/greater than 0/u);
    });
  });
});
