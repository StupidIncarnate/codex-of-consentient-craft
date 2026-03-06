import { needsRoleFollowupSignalContract } from './needs-role-followup-signal-contract';
import { NeedsRoleFollowupSignalStub } from './needs-role-followup-signal.stub';
import { StepIdStub } from '@dungeonmaster/shared/contracts';

describe('needsRoleFollowupSignalContract', () => {
  describe('valid inputs', () => {
    it('VALID: {signal: "needs-role-followup", stepId, targetRole, reason, context, resume: true} => parses successfully', () => {
      const stepId = StepIdStub({ value: 'create-login-api' });
      const input = NeedsRoleFollowupSignalStub({
        stepId,
        targetRole: 'code-reviewer',
        reason: 'Code needs review',
        context: 'Implementation complete',
        resume: true,
      });

      const result = needsRoleFollowupSignalContract.parse(input);

      expect(result).toStrictEqual({
        signal: 'needs-role-followup',
        stepId: 'create-login-api',
        targetRole: 'code-reviewer',
        reason: 'Code needs review',
        context: 'Implementation complete',
        resume: true,
      });
    });

    it('VALID: {resume: false} => parses with resume false', () => {
      const input = NeedsRoleFollowupSignalStub({ resume: false });

      const result = needsRoleFollowupSignalContract.parse(input);

      expect(result).toStrictEqual({
        signal: 'needs-role-followup',
        stepId: 'create-login-api',
        targetRole: 'test-writer',
        reason: 'Need test coverage for new feature',
        context: 'Implementation complete, tests needed',
        resume: false,
      });
    });

    it('VALID: {default stub values} => parses with defaults', () => {
      const input = NeedsRoleFollowupSignalStub();

      const result = needsRoleFollowupSignalContract.parse(input);

      expect(result).toStrictEqual({
        signal: 'needs-role-followup',
        stepId: 'create-login-api',
        targetRole: 'test-writer',
        reason: 'Need test coverage for new feature',
        context: 'Implementation complete, tests needed',
        resume: true,
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_SIGNAL: {signal: "wrong"} => throws validation error', () => {
      expect(() => {
        needsRoleFollowupSignalContract.parse({
          signal: 'wrong',
          stepId: StepIdStub(),
          targetRole: 'test-role',
          reason: 'Test reason',
          context: 'Test context',
          resume: true,
        });
      }).toThrow(/Invalid literal value/u);
    });

    it('INVALID_STEP_ID: {stepId: "INVALID"} => throws validation error', () => {
      expect(() => {
        needsRoleFollowupSignalContract.parse({
          signal: 'needs-role-followup',
          stepId: 'INVALID',
          targetRole: 'test-role',
          reason: 'Test reason',
          context: 'Test context',
          resume: true,
        });
      }).toThrow(/invalid_string/u);
    });

    it('INVALID_TARGET_ROLE: {targetRole: ""} => throws validation error', () => {
      expect(() => {
        needsRoleFollowupSignalContract.parse({
          signal: 'needs-role-followup',
          stepId: StepIdStub(),
          targetRole: '',
          reason: 'Test reason',
          context: 'Test context',
          resume: true,
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID_REASON: {reason: ""} => throws validation error', () => {
      expect(() => {
        needsRoleFollowupSignalContract.parse({
          signal: 'needs-role-followup',
          stepId: StepIdStub(),
          targetRole: 'test-role',
          reason: '',
          context: 'Test context',
          resume: true,
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID_CONTEXT: {context: ""} => throws validation error', () => {
      expect(() => {
        needsRoleFollowupSignalContract.parse({
          signal: 'needs-role-followup',
          stepId: StepIdStub(),
          targetRole: 'test-role',
          reason: 'Test reason',
          context: '',
          resume: true,
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID_RESUME: {resume: "yes"} => throws validation error', () => {
      expect(() => {
        needsRoleFollowupSignalContract.parse({
          signal: 'needs-role-followup',
          stepId: StepIdStub(),
          targetRole: 'test-role',
          reason: 'Test reason',
          context: 'Test context',
          resume: 'yes',
        });
      }).toThrow(/Expected boolean/u);
    });

    it('EMPTY: {} => throws validation error for missing required fields', () => {
      expect(() => {
        needsRoleFollowupSignalContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
