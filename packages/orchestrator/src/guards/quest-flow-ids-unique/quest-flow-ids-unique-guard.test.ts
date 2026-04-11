import { FlowStub, FlowIdStub } from '@dungeonmaster/shared/contracts';

import { questFlowIdsUniqueGuard } from './quest-flow-ids-unique-guard';

describe('questFlowIdsUniqueGuard', () => {
  describe('unique flow ids', () => {
    it('VALID: {single flow} => returns true', () => {
      const flows = [FlowStub()];

      const result = questFlowIdsUniqueGuard({ flows });

      expect(result).toBe(true);
    });

    it('VALID: {multiple flows with distinct ids} => returns true', () => {
      const flows = [
        FlowStub({ id: FlowIdStub({ value: 'login-flow' }) }),
        FlowStub({ id: FlowIdStub({ value: 'signup-flow' }) }),
      ];

      const result = questFlowIdsUniqueGuard({ flows });

      expect(result).toBe(true);
    });

    it('VALID: {empty flows array} => returns true', () => {
      const result = questFlowIdsUniqueGuard({ flows: [] });

      expect(result).toBe(true);
    });
  });

  describe('duplicate flow ids', () => {
    it('INVALID: {two flows with identical id} => returns false', () => {
      const flows = [
        FlowStub({ id: FlowIdStub({ value: 'login-flow' }) }),
        FlowStub({ id: FlowIdStub({ value: 'login-flow' }) }),
      ];

      const result = questFlowIdsUniqueGuard({ flows });

      expect(result).toBe(false);
    });

    it('INVALID: {three flows with one duplicate pair} => returns false', () => {
      const flows = [
        FlowStub({ id: FlowIdStub({ value: 'login-flow' }) }),
        FlowStub({ id: FlowIdStub({ value: 'signup-flow' }) }),
        FlowStub({ id: FlowIdStub({ value: 'login-flow' }) }),
      ];

      const result = questFlowIdsUniqueGuard({ flows });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {flows: undefined} => returns false', () => {
      const result = questFlowIdsUniqueGuard({});

      expect(result).toBe(false);
    });
  });
});
