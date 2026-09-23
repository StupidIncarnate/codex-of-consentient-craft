import { ExecutionRoleStub } from '../../contracts/execution-role/execution-role.stub';
import { ExecutionStepStatusStub } from '../../contracts/execution-step-status/execution-step-status.stub';
import { executionRowDisplayResolveTransformer } from './execution-row-display-resolve-transformer';

describe('executionRowDisplayResolveTransformer', () => {
  describe('known status and role', () => {
    it('VALID: {status: "in_progress", role: "codeweaver"} => returns RUNNING/primary/primary', () => {
      const result = executionRowDisplayResolveTransformer({
        status: ExecutionStepStatusStub({ value: 'in_progress' }),
        role: ExecutionRoleStub({ value: 'codeweaver' }),
      });

      expect(result).toStrictEqual({
        statusLabel: 'RUNNING',
        statusColor: 'primary',
        roleColor: 'primary',
      });
    });

    it('VALID: {status: "failed", role: "ward"} => returns FAILED/danger/warning', () => {
      const result = executionRowDisplayResolveTransformer({
        status: ExecutionStepStatusStub({ value: 'failed' }),
        role: ExecutionRoleStub({ value: 'ward' }),
      });

      expect(result).toStrictEqual({
        statusLabel: 'FAILED',
        statusColor: 'danger',
        roleColor: 'warning',
      });
    });
  });

  describe('a status/role a newer family wrote (unrecognized by this build)', () => {
    it('VALID: {status: "reviewing_by_dragon" (unknown), role: "codeweaver"} => renders the raw status as its own label, with the neutral fallback colour, and the role resolves normally', () => {
      const result = executionRowDisplayResolveTransformer({
        status: 'reviewing_by_dragon' as never,
        role: ExecutionRoleStub({ value: 'codeweaver' }),
      });

      expect(result).toStrictEqual({
        statusLabel: 'reviewing_by_dragon',
        statusColor: 'text-dim',
        roleColor: 'primary',
      });
    });

    it('VALID: {status: "in_progress", role: "questgiver" (unknown)} => the status resolves normally and the role colour falls back to the neutral colour', () => {
      const result = executionRowDisplayResolveTransformer({
        status: ExecutionStepStatusStub({ value: 'in_progress' }),
        role: 'questgiver' as never,
      });

      expect(result).toStrictEqual({
        statusLabel: 'RUNNING',
        statusColor: 'primary',
        roleColor: 'text-dim',
      });
    });

    it('VALID: {status: "reviewing_by_dragon" (unknown), role: "questgiver" (unknown)} => both fall back to the neutral colour, and the status label is the raw value', () => {
      const result = executionRowDisplayResolveTransformer({
        status: 'reviewing_by_dragon' as never,
        role: 'questgiver' as never,
      });

      expect(result).toStrictEqual({
        statusLabel: 'reviewing_by_dragon',
        statusColor: 'text-dim',
        roleColor: 'text-dim',
      });
    });
  });
});
