import { questResumeOutcomeContract } from './quest-resume-outcome-contract';
import { QuestResumeOutcomeStub } from './quest-resume-outcome.stub';

describe('questResumeOutcomeContract', () => {
  describe('valid outcomes', () => {
    it('VALID: {resumed, restoredStatus, dispatch started} => parses the queue-is-moving outcome', () => {
      const result = questResumeOutcomeContract.parse({
        resumed: true,
        restoredStatus: 'in_progress',
        dispatch: { started: true },
      });

      expect(result).toStrictEqual({
        resumed: true,
        restoredStatus: 'in_progress',
        dispatch: { started: true },
      });
    });

    it('VALID: {dispatch not started, with a reason} => parses so the UI can say why nothing is running', () => {
      const result = questResumeOutcomeContract.parse({
        resumed: true,
        restoredStatus: 'in_progress',
        dispatch: { started: false, reason: 'the quest has no dispatchable work' },
      });

      expect(result).toStrictEqual({
        resumed: true,
        restoredStatus: 'in_progress',
        dispatch: { started: false, reason: 'the quest has no dispatchable work' },
      });
    });

    it('VALID: {default stub} => parses with the queue started and no reason', () => {
      const result = questResumeOutcomeContract.parse(QuestResumeOutcomeStub());

      expect(result).toStrictEqual({
        resumed: true,
        restoredStatus: 'in_progress',
        dispatch: { started: true },
      });
    });
  });

  describe('invalid outcomes', () => {
    it('INVALID: {dispatch missing} => throws because a resume must report whether the queue started', () => {
      expect(() =>
        questResumeOutcomeContract.parse({ resumed: true, restoredStatus: 'in_progress' }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {restoredStatus: not-a-status} => throws', () => {
      expect(() =>
        questResumeOutcomeContract.parse({
          resumed: true,
          restoredStatus: 'nonsense',
          dispatch: { started: true },
        }),
      ).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {dispatch.started: "yes"} => throws Expected boolean', () => {
      expect(() =>
        questResumeOutcomeContract.parse({
          resumed: true,
          restoredStatus: 'in_progress',
          dispatch: { started: 'yes' },
        }),
      ).toThrow(/Expected boolean/u);
    });
  });
});
