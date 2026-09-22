import { FlowEdgeStub } from '../flow-edge/flow-edge.stub';
import { FlowNodeStub } from '../flow-node/flow-node.stub';
import { FlowOffMapSignoffStub } from '../flow-off-map-signoff/flow-off-map-signoff.stub';
import { FlowRecipeStub } from '../flow-recipe/flow-recipe.stub';
import { flowContract } from './flow-contract';
import { FlowStub } from './flow.stub';

describe('flowContract', () => {
  describe('valid flows', () => {
    it('VALID: {all fields} => parses successfully', () => {
      const flow = FlowStub();

      expect(flow).toStrictEqual({
        id: 'login-flow',
        name: 'Login Flow',
        flowType: 'runtime',
        entryPoint: '/login',
        exitPoints: ['/dashboard'],
        nodes: [],
        edges: [],
        offMapSignoffs: [],
        recipes: [],
      });
    });

    it('VALID: {flowType: "operational"} => parses with operational flow type', () => {
      const flow = FlowStub({ flowType: 'operational' });

      expect(flow.flowType).toBe('operational');
    });

    it('VALID: {with scope} => parses with scope', () => {
      const flow = FlowStub({ scope: 'Authentication module' });

      expect(flow.scope).toBe('Authentication module');
    });

    it('VALID: {with nodes} => parses with nodes array', () => {
      const node = FlowNodeStub();
      const flow = FlowStub({ nodes: [node] });

      expect(flow.nodes).toStrictEqual([node]);
    });

    it('VALID: {with edges} => parses with edges array', () => {
      const edge = FlowEdgeStub();
      const flow = FlowStub({ edges: [edge] });

      expect(flow.edges).toStrictEqual([edge]);
    });

    it('VALID: {multiple exitPoints} => parses with multiple exits', () => {
      const flow = FlowStub({
        exitPoints: ['/dashboard', '/error', '/logout'],
      });

      expect(flow.exitPoints).toStrictEqual(['/dashboard', '/error', '/logout']);
    });

    it('VALID: {without nodes field} => defaults to empty array', () => {
      const result = flowContract.parse({
        id: 'login-flow',
        name: 'Login Flow',
        flowType: 'runtime',
        entryPoint: '/login',
        exitPoints: ['/dashboard'],
      });

      expect(result).toStrictEqual({
        id: 'login-flow',
        name: 'Login Flow',
        flowType: 'runtime',
        entryPoint: '/login',
        exitPoints: ['/dashboard'],
        nodes: [],
        edges: [],
        offMapSignoffs: [],
        recipes: [],
      });
    });
  });

  describe('off-map sign-offs', () => {
    it('EMPTY: {without offMapSignoffs field} => defaults to an empty array, the shape a flow with no family closed carries', () => {
      const result = flowContract.parse({
        id: 'login-flow',
        name: 'Login Flow',
        flowType: 'runtime',
        entryPoint: '/login',
        exitPoints: ['/dashboard'],
      });

      expect(result.offMapSignoffs).toStrictEqual([]);
    });

    it('VALID: {two families signed} => round-trips one entry per family, each keyed by its own id', () => {
      const flow = FlowStub({
        offMapSignoffs: [
          FlowOffMapSignoffStub({
            id: 'concurrency',
          }),
          FlowOffMapSignoffStub({
            id: 'staleness',
          }),
        ],
      });

      expect(flow.offMapSignoffs).toStrictEqual([{ id: 'concurrency' }, { id: 'staleness' }]);
    });
  });

  describe('recipes', () => {
    it('EMPTY: {without recipes field} => defaults to an empty array, the shape a flow proving none carries', () => {
      const result = flowContract.parse({
        id: 'login-flow',
        name: 'Login Flow',
        flowType: 'runtime',
        entryPoint: '/login',
        exitPoints: ['/dashboard'],
      });

      expect(result.recipes).toStrictEqual([]);
    });

    it('VALID: {one recipes[] entry} => round-trips, keyed by its own id', () => {
      const flow = FlowStub({
        recipes: [FlowRecipeStub({ id: 'pc-walk-1', instanceId: 'inst_7f3a9c21', runId: 'run_2' })],
      });

      expect(flow.recipes).toStrictEqual([
        {
          id: 'pc-walk-1',
          instanceId: 'inst_7f3a9c21',
          runId: 'run_2',
        },
      ]);
    });
  });

  describe('invalid flows', () => {
    it('INVALID: {without flowType field} => throws validation error', () => {
      expect(() => {
        flowContract.parse({
          id: 'login-flow',
          name: 'Login Flow',
          entryPoint: '/login',
          exitPoints: ['/dashboard'],
        });
      }).toThrow(/Required/u);
    });

    it('INVALID: {id: "Bad"} => throws validation error', () => {
      expect(() => {
        flowContract.parse({
          id: 'Bad',
          name: 'Login Flow',
          flowType: 'runtime',
          entryPoint: '/login',
          exitPoints: ['/dashboard'],
        });
      }).toThrow(/invalid_string/u);
    });

    it('INVALID: {name: ""} => throws validation error', () => {
      expect(() => {
        flowContract.parse({
          id: 'login-flow',
          name: '',
          flowType: 'runtime',
          entryPoint: '/login',
          exitPoints: ['/dashboard'],
        });
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID: {entryPoint: ""} => throws validation error', () => {
      expect(() => {
        flowContract.parse({
          id: 'login-flow',
          name: 'Login Flow',
          flowType: 'runtime',
          entryPoint: '',
          exitPoints: ['/dashboard'],
        });
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID: {exitPoints: []} => throws validation error', () => {
      expect(() => {
        flowContract.parse({
          id: 'login-flow',
          name: 'Login Flow',
          flowType: 'runtime',
          entryPoint: '/login',
          exitPoints: [],
        });
      }).toThrow(/Array must contain at least 1 element/u);
    });

    it('INVALID: {missing required fields} => throws validation error', () => {
      expect(() => {
        flowContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
