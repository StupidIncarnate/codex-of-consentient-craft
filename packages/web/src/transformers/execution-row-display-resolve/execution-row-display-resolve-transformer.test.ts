import { WorkItemStub } from '@dungeonmaster/shared/contracts';
import { ExecutionRoleStub } from '../../contracts/execution-role/execution-role.stub';
import { ExecutionStepStatusStub } from '../../contracts/execution-step-status/execution-step-status.stub';
import { executionRowDisplayResolveTransformer } from './execution-row-display-resolve-transformer';

describe('executionRowDisplayResolveTransformer', () => {
  describe('known status and role, no workItem', () => {
    it('VALID: {status: "in_progress", role: "codeweaver", workItem: undefined} => returns RUNNING/primary/primary', () => {
      const result = executionRowDisplayResolveTransformer({
        status: ExecutionStepStatusStub({ value: 'in_progress' }),
        role: ExecutionRoleStub({ value: 'codeweaver' }),
        workItem: undefined,
      });

      expect(result).toStrictEqual({
        statusLabel: 'RUNNING',
        statusColor: 'primary',
        roleColor: 'primary',
      });
    });

    it('VALID: {status: "failed", role: "ward", workItem: undefined} => returns FAILED/danger/warning', () => {
      const result = executionRowDisplayResolveTransformer({
        status: ExecutionStepStatusStub({ value: 'failed' }),
        role: ExecutionRoleStub({ value: 'ward' }),
        workItem: undefined,
      });

      expect(result).toStrictEqual({
        statusLabel: 'FAILED',
        statusColor: 'danger',
        roleColor: 'warning',
      });
    });
  });

  describe('step colour (T2-9b) — wins over the role colour when it resolves', () => {
    it('VALID: {role: "codeweaver", workItem.step: "ward"} => resolves the ward warning colour, not the codeweaver role colour (the regression)', () => {
      const result = executionRowDisplayResolveTransformer({
        status: ExecutionStepStatusStub({ value: 'in_progress' }),
        role: ExecutionRoleStub({ value: 'codeweaver' }),
        workItem: WorkItemStub({ step: 'ward' }),
      });

      expect(result).toStrictEqual({
        statusLabel: 'RUNNING',
        statusColor: 'primary',
        roleColor: 'warning',
      });
    });

    it('VALID: {role: "codeweaver", workItem.step: "plan"} => resolves the plan step colour', () => {
      const result = executionRowDisplayResolveTransformer({
        status: ExecutionStepStatusStub({ value: 'in_progress' }),
        role: ExecutionRoleStub({ value: 'codeweaver' }),
        workItem: WorkItemStub({ step: 'plan' }),
      });

      expect(result).toStrictEqual({
        statusLabel: 'RUNNING',
        statusColor: 'primary',
        roleColor: 'text',
      });
    });

    it('VALID: {role: "codeweaver", workItem.step: "dragonStep" (unrecognized)} => falls through to the role colour', () => {
      const result = executionRowDisplayResolveTransformer({
        status: ExecutionStepStatusStub({ value: 'in_progress' }),
        role: ExecutionRoleStub({ value: 'codeweaver' }),
        workItem: WorkItemStub({ step: 'dragonStep' }),
      });

      expect(result).toStrictEqual({
        statusLabel: 'RUNNING',
        statusColor: 'primary',
        roleColor: 'primary',
      });
    });

    it('VALID: {role: "codeweaver", workItem: undefined} => falls through to the role colour, same as an unrecognized step', () => {
      const result = executionRowDisplayResolveTransformer({
        status: ExecutionStepStatusStub({ value: 'in_progress' }),
        role: ExecutionRoleStub({ value: 'codeweaver' }),
        workItem: undefined,
      });

      expect(result).toStrictEqual({
        statusLabel: 'RUNNING',
        statusColor: 'primary',
        roleColor: 'primary',
      });
    });

    it('VALID: {role: "questgiver" (unknown), workItem.step: "dragonStep" (unknown)} => both fall back to the neutral colour', () => {
      const result = executionRowDisplayResolveTransformer({
        status: ExecutionStepStatusStub({ value: 'in_progress' }),
        role: 'questgiver' as never,
        workItem: WorkItemStub({ step: 'dragonStep' }),
      });

      expect(result).toStrictEqual({
        statusLabel: 'RUNNING',
        statusColor: 'primary',
        roleColor: 'text-dim',
      });
    });
  });

  describe('a status/role a newer family wrote (unrecognized by this build)', () => {
    it('VALID: {status: "reviewing_by_dragon" (unknown), role: "codeweaver", workItem: undefined} => renders the raw status as its own label, with the neutral fallback colour, and the role resolves normally', () => {
      const result = executionRowDisplayResolveTransformer({
        status: 'reviewing_by_dragon' as never,
        role: ExecutionRoleStub({ value: 'codeweaver' }),
        workItem: undefined,
      });

      expect(result).toStrictEqual({
        statusLabel: 'reviewing_by_dragon',
        statusColor: 'text-dim',
        roleColor: 'primary',
      });
    });

    it('VALID: {status: "in_progress", role: "questgiver" (unknown), workItem: undefined} => the status resolves normally and the role colour falls back to the neutral colour', () => {
      const result = executionRowDisplayResolveTransformer({
        status: ExecutionStepStatusStub({ value: 'in_progress' }),
        role: 'questgiver' as never,
        workItem: undefined,
      });

      expect(result).toStrictEqual({
        statusLabel: 'RUNNING',
        statusColor: 'primary',
        roleColor: 'text-dim',
      });
    });

    it('VALID: {status: "reviewing_by_dragon" (unknown), role: "questgiver" (unknown), workItem: undefined} => both fall back to the neutral colour, and the status label is the raw value', () => {
      const result = executionRowDisplayResolveTransformer({
        status: 'reviewing_by_dragon' as never,
        role: 'questgiver' as never,
        workItem: undefined,
      });

      expect(result).toStrictEqual({
        statusLabel: 'reviewing_by_dragon',
        statusColor: 'text-dim',
        roleColor: 'text-dim',
      });
    });
  });

  describe('a stale quest.json carrying the removed partially_complete status', () => {
    it('VALID: {status: "partially_complete" (removed from executionStepStatusConfigStatics), role: "codeweaver", workItem: undefined} => renders the raw status as its own label, with the neutral fallback colour, instead of crashing', () => {
      const result = executionRowDisplayResolveTransformer({
        status: 'partially_complete' as never,
        role: ExecutionRoleStub({ value: 'codeweaver' }),
        workItem: undefined,
      });

      expect(result).toStrictEqual({
        statusLabel: 'partially_complete',
        statusColor: 'text-dim',
        roleColor: 'primary',
      });
    });
  });
});
