import { FlowEdgeStub } from '../flow-edge/flow-edge.stub';
import { FlowNodeStub } from '../flow-node/flow-node.stub';
import { flowContract } from './flow-contract';
import { FlowStub } from './flow.stub';

describe('flowContract', () => {
  describe('valid flows', () => {
    it('VALID: {all fields} => parses successfully', () => {
      const flow = FlowStub();

      expect(flow).toStrictEqual({
        id: 'c23bd10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Login Flow',
        entryPoint: '/login',
        exitPoints: ['/dashboard'],
        nodes: [],
        edges: [],
      });
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

    it('VALID: {without nodes field} => backward compat defaults to empty array', () => {
      const result = flowContract.parse({
        id: 'c23bd10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Login Flow',
        entryPoint: '/login',
        exitPoints: ['/dashboard'],
      });

      expect(result).toStrictEqual({
        id: 'c23bd10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Login Flow',
        entryPoint: '/login',
        exitPoints: ['/dashboard'],
        nodes: [],
        edges: [],
      });
    });
  });

  describe('invalid flows', () => {
    it('INVALID_ID: {id: "bad"} => throws validation error', () => {
      expect(() => {
        flowContract.parse({
          id: 'bad',
          name: 'Login Flow',
          entryPoint: '/login',
          exitPoints: ['/dashboard'],
        });
      }).toThrow(/Invalid uuid/u);
    });

    it('INVALID_NAME: {name: ""} => throws validation error', () => {
      expect(() => {
        flowContract.parse({
          id: 'c23bd10b-58cc-4372-a567-0e02b2c3d479',
          name: '',
          entryPoint: '/login',
          exitPoints: ['/dashboard'],
        });
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID_ENTRY_POINT: {entryPoint: ""} => throws validation error', () => {
      expect(() => {
        flowContract.parse({
          id: 'c23bd10b-58cc-4372-a567-0e02b2c3d479',
          name: 'Login Flow',
          entryPoint: '',
          exitPoints: ['/dashboard'],
        });
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID: {missing required fields} => throws validation error', () => {
      expect(() => {
        flowContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
