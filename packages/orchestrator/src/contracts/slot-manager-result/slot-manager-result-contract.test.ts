import { DependencyStepStub } from '@dungeonmaster/shared/contracts';

import { slotManagerResultContract } from './slot-manager-result-contract';
import { SlotManagerResultIncompleteStub, SlotManagerResultStub } from './slot-manager-result.stub';

describe('slotManagerResultContract', () => {
  describe('completed: true', () => {
    it('VALID: {completed: true} => parses successfully', () => {
      const result = slotManagerResultContract.parse({
        completed: true,
      });

      expect(result).toStrictEqual({
        completed: true,
      });
    });

    it('VALID: {SlotManagerResultStub()} => creates completed result', () => {
      const result = SlotManagerResultStub();

      expect(result).toStrictEqual({
        completed: true,
      });
    });
  });

  describe('completed: false', () => {
    it('VALID: {completed: false, incompleteSteps: [step]} => parses successfully', () => {
      const step = DependencyStepStub({ status: 'failed' });
      const result = slotManagerResultContract.parse({
        completed: false,
        incompleteSteps: [step],
      });

      expect(result).toStrictEqual({
        completed: false,
        incompleteSteps: [step],
      });
    });

    it('VALID: {completed: false, incompleteSteps: []} => parses with empty array', () => {
      const result = slotManagerResultContract.parse({
        completed: false,
        incompleteSteps: [],
      });

      expect(result).toStrictEqual({
        completed: false,
        incompleteSteps: [],
      });
    });

    it('VALID: {SlotManagerResultIncompleteStub()} => creates incomplete result', () => {
      const result = SlotManagerResultIncompleteStub();

      expect(result).toStrictEqual({
        completed: false,
        incompleteSteps: [DependencyStepStub()],
      });
    });
  });

  describe('invalid cases', () => {
    it('INVALID_COMPLETED: {missing completed} => throws discriminator error', () => {
      expect(() => slotManagerResultContract.parse({})).toThrow(/Invalid discriminator value/u);
    });

    it('INVALID_COMPLETED: {completed: "invalid"} => throws discriminator error', () => {
      expect(() =>
        slotManagerResultContract.parse({
          completed: 'invalid' as never,
        }),
      ).toThrow(/Invalid discriminator value/u);
    });

    it('INVALID_INCOMPLETE_STEPS: {completed: false, missing incompleteSteps} => throws required error', () => {
      expect(() =>
        slotManagerResultContract.parse({
          completed: false,
        }),
      ).toThrow(/Required/u);
    });
  });
});
