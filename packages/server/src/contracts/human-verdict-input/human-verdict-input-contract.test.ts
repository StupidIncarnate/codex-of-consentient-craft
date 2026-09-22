import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { humanVerdictInputContract } from './human-verdict-input-contract';
import { HumanVerdictInputStub } from './human-verdict-input.stub';

const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });

describe('humanVerdictInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {questId, unitId, outcome: met, reason} => parses', () => {
      const result = humanVerdictInputContract.parse({
        questId,
        unitId: 'motion-feels-smooth',
        outcome: 'met',
        reason: 'Watched it end to end.',
      });

      expect(result).toStrictEqual({
        questId: 'aaaaaaaa-1111-4222-9333-444444444444',
        unitId: 'motion-feels-smooth',
        outcome: 'met',
        reason: 'Watched it end to end.',
      });
    });

    it('VALID: {outcome: not-met} => parses the rejection outcome', () => {
      const result = humanVerdictInputContract.parse({
        questId,
        unitId: 'motion-feels-smooth',
        outcome: 'not-met',
        reason: 'Visibly janky.',
      });

      expect(result.outcome).toBe('not-met');
    });

    it('VALID: {default stub} => parses with defaults', () => {
      const input = HumanVerdictInputStub();

      const result = humanVerdictInputContract.parse(input);

      expect(result).toStrictEqual({
        questId: 'add-auth',
        unitId: 'motion-feels-smooth',
        outcome: 'met',
        reason: 'Watched run_7/walk.webm end to end — the transition never stutters.',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {outcome: "confirmed"} => throws because the outcome set is closed to met/not-met', () => {
      expect(() =>
        humanVerdictInputContract.parse({
          questId,
          unitId: 'motion-feels-smooth',
          outcome: 'confirmed',
          reason: 'Watched it.',
        }),
      ).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {missing questId} => throws validation error', () => {
      expect(() =>
        humanVerdictInputContract.parse({
          unitId: 'motion-feels-smooth',
          outcome: 'met',
          reason: 'Watched it.',
        }),
      ).toThrow(/Required/u);
    });

    it('EMPTY: {unitId: ""} => throws because an empty unitId names no observable', () => {
      expect(() =>
        humanVerdictInputContract.parse({
          questId,
          unitId: '',
          outcome: 'met',
          reason: 'Watched it.',
        }),
      ).toThrow(/String must contain at least 1 character/u);
    });

    it('EMPTY: {reason: ""} => throws because an empty reason explains nothing', () => {
      expect(() =>
        humanVerdictInputContract.parse({
          questId,
          unitId: 'motion-feels-smooth',
          outcome: 'met',
          reason: '',
        }),
      ).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID: {unknown key} => throws Unrecognized key error because the contract is strict', () => {
      expect(() =>
        humanVerdictInputContract.parse({
          questId,
          unitId: 'motion-feels-smooth',
          outcome: 'met',
          reason: 'Watched it.',
          workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        } as never),
      ).toThrow(/Unrecognized key/u);
    });
  });
});
