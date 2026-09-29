import { FlowNodeStub } from '@dungeonmaster/shared/contracts/flow-node/flow-node.stub';
import { FlowObservableStub } from '@dungeonmaster/shared/contracts/flow-observable/flow-observable.stub';
import { FlowStub } from '@dungeonmaster/shared/contracts/flow/flow.stub';

import { questObservablesMissingDescriptionTransformer } from './quest-observables-missing-description-transformer';

describe('questObservablesMissingDescriptionTransformer', () => {
  describe('all have description', () => {
    it('VALID: {all observables have description} => returns []', () => {
      const node = FlowNodeStub({ observables: [FlowObservableStub()] });
      const flow = FlowStub({ nodes: [node] });

      const result = questObservablesMissingDescriptionTransformer({ flows: [flow] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('missing description', () => {
    it('INVALID: {observable has empty description} => returns description', () => {
      const observable = FlowObservableStub({ id: 'obs-empty' });
      Object.assign(observable, { description: '' });
      const node = FlowNodeStub({ id: 'done', observables: [observable] });
      const flow = FlowStub({ id: 'login-flow', nodes: [node] });

      const result = questObservablesMissingDescriptionTransformer({ flows: [flow] });

      expect(result).toStrictEqual([
        "flow 'login-flow' node 'done' observable 'obs-empty' has empty description",
      ]);
    });
  });

  describe('empty', () => {
    it('EMPTY: {flows: undefined} => returns []', () => {
      const result = questObservablesMissingDescriptionTransformer({});

      expect(result).toStrictEqual([]);
    });
  });
});
