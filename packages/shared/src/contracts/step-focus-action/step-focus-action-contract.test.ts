import { stepFocusActionContract } from './step-focus-action-contract';
import { StepFocusActionStub } from './step-focus-action.stub';

describe('stepFocusActionContract', () => {
  describe('valid actions', () => {
    it('VALID: {default stub} => parses with verification kind and default description', () => {
      const action = StepFocusActionStub();

      expect(action).toStrictEqual({
        kind: 'verification',
        description: 'Run ward and assert zero failures',
      });
    });

    it('VALID: {kind: "command", description: "terraform apply"} => parses successfully', () => {
      const action = StepFocusActionStub({
        kind: 'command',
        description: 'terraform apply',
      });

      expect(action).toStrictEqual({
        kind: 'command',
        description: 'terraform apply',
      });
    });

    it('VALID: {kind: "sweep-check"} => parses successfully', () => {
      const action = StepFocusActionStub({
        kind: 'sweep-check',
        description: 'zero matches for : void across adapter files',
      });

      expect(action.kind).toBe('sweep-check');
    });

    it('VALID: {kind: "custom"} => parses successfully', () => {
      const action = StepFocusActionStub({
        kind: 'custom',
        description: 'bespoke assertion',
      });

      expect(action.kind).toBe('custom');
    });
  });

  describe('invalid actions', () => {
    it('INVALID: {kind: "invalid-kind"} => throws validation error', () => {
      expect(() => {
        stepFocusActionContract.parse({
          kind: 'invalid-kind',
          description: 'anything',
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {description: ""} => throws validation error', () => {
      expect(() => {
        stepFocusActionContract.parse({
          kind: 'verification',
          description: '',
        });
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID: {missing description} => throws validation error', () => {
      expect(() => {
        stepFocusActionContract.parse({
          kind: 'verification',
        });
      }).toThrow(/Required/u);
    });

    it('INVALID: {missing kind} => throws validation error', () => {
      expect(() => {
        stepFocusActionContract.parse({
          description: 'anything',
        });
      }).toThrow(/Required/u);
    });
  });
});
