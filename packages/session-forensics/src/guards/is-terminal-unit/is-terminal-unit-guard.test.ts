import { isTerminalUnitGuard } from './is-terminal-unit-guard';
import { FlowNodeIdStub, FlowNodeTypeStub } from '@dungeonmaster/shared/contracts';

type FlowNodeId = ReturnType<typeof FlowNodeIdStub>;

describe('isTerminalUnitGuard', () => {
  describe('terminal node with nothing leaving it', () => {
    it('VALID: {nodeType: terminal, nodeId not an edge source} => returns true', () => {
      const nodeId = FlowNodeIdStub({ value: 'checkout-success' });
      const nodeType = FlowNodeTypeStub({ value: 'terminal' });
      const edgeSourceIds = [FlowNodeIdStub({ value: 'confirm-order' })];

      expect(isTerminalUnitGuard({ nodeId, nodeType, edgeSourceIds })).toBe(true);
    });
  });

  describe('a node the graph prints (terminal) that still points onward', () => {
    it('INVALID: {nodeType: terminal, nodeId is an edge source} => returns false', () => {
      const nodeId = FlowNodeIdStub({ value: 'reject-payment-back' });
      const nodeType = FlowNodeTypeStub({ value: 'terminal' });
      const edgeSourceIds = [nodeId];

      expect(isTerminalUnitGuard({ nodeId, nodeType, edgeSourceIds })).toBe(false);
    });
  });

  describe('non-terminal node types never count, whatever their edges', () => {
    it('INVALID: {nodeType: action, no outgoing edge} => returns false', () => {
      const nodeId = FlowNodeIdStub({ value: 'process-payment' });
      const nodeType = FlowNodeTypeStub({ value: 'action' });
      const edgeSourceIds: readonly FlowNodeId[] = [];

      expect(isTerminalUnitGuard({ nodeId, nodeType, edgeSourceIds })).toBe(false);
    });

    it('INVALID: {nodeType: decision, nodeId is an edge source} => returns false', () => {
      const nodeId = FlowNodeIdStub({ value: 'choose-shipping' });
      const nodeType = FlowNodeTypeStub({ value: 'decision' });
      const edgeSourceIds = [nodeId];

      expect(isTerminalUnitGuard({ nodeId, nodeType, edgeSourceIds })).toBe(false);
    });

    it('INVALID: {nodeType: state} => returns false', () => {
      const nodeId = FlowNodeIdStub({ value: 'cart-idle' });
      const nodeType = FlowNodeTypeStub({ value: 'state' });
      const edgeSourceIds = [FlowNodeIdStub({ value: 'cart-idle-successor' })];

      expect(isTerminalUnitGuard({ nodeId, nodeType, edgeSourceIds })).toBe(false);
    });
  });

  describe('empty edge list', () => {
    it('EMPTY: {edgeSourceIds: [], nodeType: terminal} => returns true', () => {
      const nodeId = FlowNodeIdStub({ value: 'done' });
      const nodeType = FlowNodeTypeStub({ value: 'terminal' });
      const edgeSourceIds: readonly FlowNodeId[] = [];

      expect(isTerminalUnitGuard({ nodeId, nodeType, edgeSourceIds })).toBe(true);
    });
  });

  describe('duplicate edge sources', () => {
    it('EDGE: {edgeSourceIds: [nodeId, nodeId], nodeType: terminal} => returns false', () => {
      const nodeId = FlowNodeIdStub({ value: 'loop-back' });
      const nodeType = FlowNodeTypeStub({ value: 'terminal' });
      const edgeSourceIds = [nodeId, nodeId];

      expect(isTerminalUnitGuard({ nodeId, nodeType, edgeSourceIds })).toBe(false);
    });
  });

  describe('exact matching, not substring matching', () => {
    it('EDGE: {nodeId: done, edgeSourceIds: [done-later]} => returns true', () => {
      const nodeId = FlowNodeIdStub({ value: 'done' });
      const nodeType = FlowNodeTypeStub({ value: 'terminal' });
      const edgeSourceIds = [FlowNodeIdStub({ value: 'done-later' })];

      expect(isTerminalUnitGuard({ nodeId, nodeType, edgeSourceIds })).toBe(true);
    });
  });

  describe('missing required fields', () => {
    it('EMPTY: {nodeId: undefined} => returns false', () => {
      const nodeType = FlowNodeTypeStub({ value: 'terminal' });
      const edgeSourceIds: readonly FlowNodeId[] = [];

      expect(isTerminalUnitGuard({ nodeType, edgeSourceIds })).toBe(false);
    });

    it('EMPTY: {nodeType: undefined} => returns false', () => {
      const nodeId = FlowNodeIdStub({ value: 'done' });
      const edgeSourceIds: readonly FlowNodeId[] = [];

      expect(isTerminalUnitGuard({ nodeId, edgeSourceIds })).toBe(false);
    });

    it('EMPTY: {edgeSourceIds: undefined} => returns false', () => {
      const nodeId = FlowNodeIdStub({ value: 'done' });
      const nodeType = FlowNodeTypeStub({ value: 'terminal' });

      expect(isTerminalUnitGuard({ nodeId, nodeType })).toBe(false);
    });
  });
});
