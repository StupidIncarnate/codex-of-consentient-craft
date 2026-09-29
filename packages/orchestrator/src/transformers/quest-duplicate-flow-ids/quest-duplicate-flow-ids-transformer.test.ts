import { FlowStub } from '@dungeonmaster/shared/contracts/flow/flow.stub';

import { questDuplicateFlowIdsTransformer } from './quest-duplicate-flow-ids-transformer';

describe('questDuplicateFlowIdsTransformer', () => {
  describe('no duplicates', () => {
    it('VALID: {unique flow ids} => returns []', () => {
      const flows = [FlowStub({ id: 'flow-a' }), FlowStub({ id: 'flow-b' })];

      const result = questDuplicateFlowIdsTransformer({ flows });

      expect(result).toStrictEqual([]);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {no flows} => returns []', () => {
      const result = questDuplicateFlowIdsTransformer({ flows: [] });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {flows: undefined} => returns []', () => {
      const result = questDuplicateFlowIdsTransformer({});

      expect(result).toStrictEqual([]);
    });
  });

  describe('duplicates present', () => {
    it('INVALID: {two flows share id} => returns that id', () => {
      const flows = [FlowStub({ id: 'login-flow' }), FlowStub({ id: 'login-flow' })];

      const result = questDuplicateFlowIdsTransformer({ flows });

      expect(result).toStrictEqual(['login-flow']);
    });
  });
});
