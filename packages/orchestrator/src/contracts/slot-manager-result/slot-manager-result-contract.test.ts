import { StepIdStub } from '@dungeonmaster/shared/contracts';

import { slotManagerResultContract } from './slot-manager-result-contract';
import {
  SlotManagerResultStub,
  SlotManagerResultUserInputNeededStub,
} from './slot-manager-result.stub';

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

  describe('completed: false with userInputNeeded', () => {
    it('VALID: {completed: false, userInputNeeded} => parses successfully', () => {
      const stepId = StepIdStub();
      const result = slotManagerResultContract.parse({
        completed: false,
        userInputNeeded: {
          stepId,
          question: 'What should be done?',
          context: 'Some context',
        },
      });

      expect(result).toStrictEqual({
        completed: false,
        userInputNeeded: {
          stepId,
          question: 'What should be done?',
          context: 'Some context',
        },
      });
    });

    it('VALID: {SlotManagerResultUserInputNeededStub()} => creates user input needed result', () => {
      const result = SlotManagerResultUserInputNeededStub();

      expect(result).toStrictEqual({
        completed: false,
        userInputNeeded: {
          stepId: StepIdStub(),
          question: 'What should be done?',
          context: 'Some context',
        },
      });
    });

    it('VALID: {SlotManagerResultUserInputNeededStub with custom userInputNeeded} => overrides nested fields', () => {
      const customStepId = StepIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const result = SlotManagerResultUserInputNeededStub({
        userInputNeeded: {
          stepId: customStepId,
          question: 'Custom question?',
          context: 'Custom context',
        },
      });

      expect(result).toStrictEqual({
        completed: false,
        userInputNeeded: {
          stepId: customStepId,
          question: 'Custom question?',
          context: 'Custom context',
        },
      });
    });
  });

  describe('invalid cases', () => {
    it('INVALID_COMPLETED: {missing completed} => throws invalid discriminator', () => {
      expect(() => slotManagerResultContract.parse({})).toThrow(/invalid_union_discriminator/u);
    });

    it('INVALID_COMPLETED: {completed: "invalid"} => throws invalid discriminator', () => {
      expect(() =>
        slotManagerResultContract.parse({
          completed: 'invalid' as never,
        }),
      ).toThrow(/invalid_union_discriminator/u);
    });

    it('INVALID_USER_INPUT_NEEDED: {completed: false without userInputNeeded} => throws', () => {
      expect(() =>
        slotManagerResultContract.parse({
          completed: false,
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID_STEP_ID: {invalid UUID for stepId} => throws', () => {
      expect(() =>
        slotManagerResultContract.parse({
          completed: false,
          userInputNeeded: {
            stepId: 'not-a-uuid',
            question: 'What?',
            context: 'Some context',
          },
        }),
      ).toThrow(/invalid_string/u);
    });

    it('INVALID_QUESTION: {empty question} => throws', () => {
      expect(() =>
        slotManagerResultContract.parse({
          completed: false,
          userInputNeeded: {
            stepId: StepIdStub(),
            question: '',
            context: 'Some context',
          },
        }),
      ).toThrow(/too_small/u);
    });

    it('INVALID_CONTEXT: {empty context} => throws', () => {
      expect(() =>
        slotManagerResultContract.parse({
          completed: false,
          userInputNeeded: {
            stepId: StepIdStub(),
            question: 'What?',
            context: '',
          },
        }),
      ).toThrow(/too_small/u);
    });
  });
});
