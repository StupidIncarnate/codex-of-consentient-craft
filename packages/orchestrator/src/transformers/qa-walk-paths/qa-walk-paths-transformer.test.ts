import { FlowStub } from '@dungeonmaster/shared/contracts';

import { qaWalkPathsTransformer } from './qa-walk-paths-transformer';

describe('qaWalkPathsTransformer', () => {
  describe('linear graphs', () => {
    it('VALID: {single node, no edges} => one path of that node alone', () => {
      const flow = FlowStub({
        nodes: [{ id: 'only-node', label: 'Only', type: 'state', observables: [] }],
        edges: [],
      });

      expect(qaWalkPathsTransformer({ flow })).toStrictEqual([
        { nodeIds: ['only-node'], branchLabels: [], exitsFlow: false },
      ]);
    });

    it('VALID: {three-node chain} => one path through all three in drive order', () => {
      const flow = FlowStub({
        nodes: [
          { id: 'start-here', label: 'Start', type: 'action', observables: [] },
          { id: 'middle-step', label: 'Middle', type: 'action', observables: [] },
          { id: 'end-here', label: 'End', type: 'state', observables: [] },
        ],
        edges: [
          { id: 'start-to-middle', from: 'start-here', to: 'middle-step' },
          { id: 'middle-to-end', from: 'middle-step', to: 'end-here' },
        ],
      });

      expect(qaWalkPathsTransformer({ flow })).toStrictEqual([
        {
          nodeIds: ['start-here', 'middle-step', 'end-here'],
          branchLabels: [],
          exitsFlow: false,
        },
      ]);
    });
  });

  describe('branching graphs', () => {
    it('VALID: {one decision, two labelled branches} => two paths carrying their own branch label', () => {
      const flow = FlowStub({
        nodes: [
          { id: 'decide-here', label: 'Valid?', type: 'decision', observables: [] },
          { id: 'yes-terminal', label: 'Accepted', type: 'state', observables: [] },
          { id: 'no-terminal', label: 'Rejected', type: 'state', observables: [] },
        ],
        edges: [
          { id: 'decide-yes', from: 'decide-here', to: 'yes-terminal', label: 'valid' },
          { id: 'decide-no', from: 'decide-here', to: 'no-terminal', label: 'invalid' },
        ],
      });

      expect(qaWalkPathsTransformer({ flow })).toStrictEqual([
        { nodeIds: ['decide-here', 'yes-terminal'], branchLabels: ['valid'], exitsFlow: false },
        { nodeIds: ['decide-here', 'no-terminal'], branchLabels: ['invalid'], exitsFlow: false },
      ]);
    });

    it('VALID: {nested decisions} => every leaf produces its own path with the labels accumulated in order', () => {
      const flow = FlowStub({
        nodes: [
          { id: 'first-gate', label: 'First?', type: 'decision', observables: [] },
          { id: 'second-gate', label: 'Second?', type: 'decision', observables: [] },
          { id: 'early-exit', label: 'Early exit', type: 'state', observables: [] },
          { id: 'deep-yes', label: 'Deep yes', type: 'state', observables: [] },
          { id: 'deep-no', label: 'Deep no', type: 'state', observables: [] },
        ],
        edges: [
          { id: 'first-no', from: 'first-gate', to: 'early-exit', label: 'no' },
          { id: 'first-yes', from: 'first-gate', to: 'second-gate', label: 'yes' },
          { id: 'second-yes', from: 'second-gate', to: 'deep-yes', label: 'yes' },
          { id: 'second-no', from: 'second-gate', to: 'deep-no', label: 'no' },
        ],
      });

      expect(qaWalkPathsTransformer({ flow })).toStrictEqual([
        { nodeIds: ['first-gate', 'early-exit'], branchLabels: ['no'], exitsFlow: false },
        {
          nodeIds: ['first-gate', 'second-gate', 'deep-yes'],
          branchLabels: ['yes', 'yes'],
          exitsFlow: false,
        },
        {
          nodeIds: ['first-gate', 'second-gate', 'deep-no'],
          branchLabels: ['yes', 'no'],
          exitsFlow: false,
        },
      ]);
    });

    it('VALID: {unlabelled edge} => contributes no branch label, because an unlabelled edge is sequence not a decision', () => {
      const flow = FlowStub({
        nodes: [
          { id: 'start-here', label: 'Start', type: 'action', observables: [] },
          { id: 'end-here', label: 'End', type: 'state', observables: [] },
        ],
        edges: [{ id: 'start-to-end', from: 'start-here', to: 'end-here' }],
      });

      expect(qaWalkPathsTransformer({ flow })[0]?.branchLabels).toStrictEqual([]);
    });
  });

  describe('back-edges terminate enumeration', () => {
    it('VALID: {loop back to an earlier node} => enumeration terminates and the loop adds no extra path', () => {
      const flow = FlowStub({
        nodes: [
          { id: 'type-text', label: 'Type text', type: 'action', observables: [] },
          { id: 'key-pressed', label: 'Which key?', type: 'decision', observables: [] },
          { id: 'insert-newline', label: 'Newline inserted', type: 'action', observables: [] },
          { id: 'text-queued', label: 'Queued', type: 'state', observables: [] },
        ],
        edges: [
          { id: 'type-to-key', from: 'type-text', to: 'key-pressed' },
          { id: 'key-shift', from: 'key-pressed', to: 'insert-newline', label: 'shift+enter' },
          { id: 'key-enter', from: 'key-pressed', to: 'text-queued', label: 'enter' },
          { id: 'newline-loops-back', from: 'insert-newline', to: 'type-text' },
        ],
      });

      expect(qaWalkPathsTransformer({ flow })).toStrictEqual([
        {
          nodeIds: ['type-text', 'key-pressed', 'insert-newline'],
          branchLabels: ['shift+enter'],
          exitsFlow: false,
        },
        {
          nodeIds: ['type-text', 'key-pressed', 'text-queued'],
          branchLabels: ['enter'],
          exitsFlow: false,
        },
      ]);
    });

    it('EDGE: {two-node cycle with no entry node} => falls back to the first declared node and still terminates', () => {
      const flow = FlowStub({
        nodes: [
          { id: 'node-one', label: 'One', type: 'state', observables: [] },
          { id: 'node-two', label: 'Two', type: 'state', observables: [] },
        ],
        edges: [
          { id: 'one-to-two', from: 'node-one', to: 'node-two' },
          { id: 'two-to-one', from: 'node-two', to: 'node-one' },
        ],
      });

      expect(qaWalkPathsTransformer({ flow })).toStrictEqual([
        { nodeIds: ['node-one', 'node-two'], branchLabels: [], exitsFlow: false },
      ]);
    });
  });

  describe('edges leaving the flow', () => {
    it('VALID: {cross-flow target} => path ends with exitsFlow true', () => {
      const flow = FlowStub({
        nodes: [{ id: 'start-here', label: 'Start', type: 'action', observables: [] }],
        edges: [
          { id: 'jump-out', from: 'start-here', to: 'other-flow:some-node', label: 'hands off' },
        ],
      });

      expect(qaWalkPathsTransformer({ flow })).toStrictEqual([
        { nodeIds: ['start-here'], branchLabels: ['hands off'], exitsFlow: true },
      ]);
    });

    it('VALID: {edge to an id no node declares} => path ends with exitsFlow true rather than being dropped', () => {
      const flow = FlowStub({
        nodes: [{ id: 'start-here', label: 'Start', type: 'action', observables: [] }],
        edges: [{ id: 'dangling-edge', from: 'start-here', to: 'never-declared' }],
      });

      expect(qaWalkPathsTransformer({ flow })).toStrictEqual([
        { nodeIds: ['start-here'], branchLabels: [], exitsFlow: true },
      ]);
    });
  });

  describe('multiple entry nodes', () => {
    it('VALID: {two disconnected entries} => a path from each', () => {
      const flow = FlowStub({
        nodes: [
          { id: 'entry-one', label: 'Entry one', type: 'action', observables: [] },
          { id: 'entry-two', label: 'Entry two', type: 'action', observables: [] },
          { id: 'end-one', label: 'End one', type: 'state', observables: [] },
        ],
        edges: [{ id: 'one-to-end', from: 'entry-one', to: 'end-one' }],
      });

      expect(qaWalkPathsTransformer({ flow })).toStrictEqual([
        { nodeIds: ['entry-one', 'end-one'], branchLabels: [], exitsFlow: false },
        { nodeIds: ['entry-two'], branchLabels: [], exitsFlow: false },
      ]);
    });
  });

  describe('empty graphs', () => {
    it('EMPTY: {no nodes} => enumerates nothing', () => {
      expect(qaWalkPathsTransformer({ flow: FlowStub({ nodes: [], edges: [] }) })).toStrictEqual(
        [],
      );
    });
  });
});
