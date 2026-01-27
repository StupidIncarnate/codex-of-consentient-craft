import { orchestrationResultContract } from './orchestration-result-contract';
import { OrchestrationResultStub } from './orchestration-result.stub';

describe('orchestrationResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {type: all_complete} => parses successfully', () => {
      const result = orchestrationResultContract.parse({ type: 'all_complete' });

      expect(result).toStrictEqual({ type: 'all_complete' });
    });

    it('VALID: {type: all_blocked} => parses successfully', () => {
      const result = orchestrationResultContract.parse({ type: 'all_blocked' });

      expect(result).toStrictEqual({ type: 'all_blocked' });
    });

    it('VALID: {type: needs_user_input} => parses with required fields', () => {
      const result = orchestrationResultContract.parse({
        type: 'needs_user_input',
        stepId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        question: 'What is the API endpoint?',
      });

      expect(result).toStrictEqual({
        type: 'needs_user_input',
        stepId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        question: 'What is the API endpoint?',
      });
    });

    it('VALID: {type: needs_role_followup} => parses with required fields', () => {
      const result = orchestrationResultContract.parse({
        type: 'needs_role_followup',
        stepId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        targetRole: 'architect',
      });

      expect(result).toStrictEqual({
        type: 'needs_role_followup',
        stepId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        targetRole: 'architect',
      });
    });

    it('VALID: {type: error} => parses with message', () => {
      const result = orchestrationResultContract.parse({
        type: 'error',
        message: 'Something went wrong',
      });

      expect(result).toStrictEqual({
        type: 'error',
        message: 'Something went wrong',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_TYPE: {unknown type} => throws error', () => {
      expect(() => orchestrationResultContract.parse({ type: 'unknown' })).toThrow(
        /Invalid discriminator value/u,
      );
    });

    it('INVALID_NEEDS_USER_INPUT: {missing stepId} => throws error', () => {
      expect(() =>
        orchestrationResultContract.parse({
          type: 'needs_user_input',
          question: 'What is the API endpoint?',
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID_NEEDS_USER_INPUT: {invalid stepId uuid} => throws error', () => {
      expect(() =>
        orchestrationResultContract.parse({
          type: 'needs_user_input',
          stepId: 'not-a-uuid',
          question: 'What is the API endpoint?',
        }),
      ).toThrow(/Invalid uuid/u);
    });

    it('INVALID_NEEDS_USER_INPUT: {missing question} => throws error', () => {
      expect(() =>
        orchestrationResultContract.parse({
          type: 'needs_user_input',
          stepId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID_NEEDS_ROLE_FOLLOWUP: {missing stepId} => throws error', () => {
      expect(() =>
        orchestrationResultContract.parse({
          type: 'needs_role_followup',
          targetRole: 'architect',
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID_NEEDS_ROLE_FOLLOWUP: {invalid stepId uuid} => throws error', () => {
      expect(() =>
        orchestrationResultContract.parse({
          type: 'needs_role_followup',
          stepId: 'not-a-uuid',
          targetRole: 'architect',
        }),
      ).toThrow(/Invalid uuid/u);
    });

    it('INVALID_NEEDS_ROLE_FOLLOWUP: {missing targetRole} => throws error', () => {
      expect(() =>
        orchestrationResultContract.parse({
          type: 'needs_role_followup',
          stepId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID_ERROR: {missing message} => throws error', () => {
      expect(() =>
        orchestrationResultContract.parse({
          type: 'error',
        }),
      ).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates all_complete result', () => {
      const result = OrchestrationResultStub();

      expect(result).toStrictEqual({ type: 'all_complete' });
    });

    it('VALID: {type: all_blocked} => creates all_blocked result', () => {
      const result = OrchestrationResultStub({ type: 'all_blocked' });

      expect(result).toStrictEqual({ type: 'all_blocked' });
    });

    it('VALID: {type: needs_user_input} => creates needs_user_input result', () => {
      const result = OrchestrationResultStub({
        type: 'needs_user_input',
        stepId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        question: 'What is the API endpoint?',
      });

      expect(result).toStrictEqual({
        type: 'needs_user_input',
        stepId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        question: 'What is the API endpoint?',
      });
    });

    it('VALID: {type: needs_role_followup} => creates needs_role_followup result', () => {
      const result = OrchestrationResultStub({
        type: 'needs_role_followup',
        stepId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        targetRole: 'architect',
      });

      expect(result).toStrictEqual({
        type: 'needs_role_followup',
        stepId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        targetRole: 'architect',
      });
    });

    it('VALID: {type: error} => creates error result', () => {
      const result = OrchestrationResultStub({
        type: 'error',
        message: 'Something went wrong',
      });

      expect(result).toStrictEqual({
        type: 'error',
        message: 'Something went wrong',
      });
    });
  });
});
