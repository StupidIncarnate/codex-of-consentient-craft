import { questResumeResponseDataContract } from './quest-resume-response-data-contract';
import { QuestResumeResponseDataStub } from './quest-resume-response-data.stub';

describe('questResumeResponseDataContract', () => {
  it('VALID: {default stub} => parses to the default data', () => {
    const result = QuestResumeResponseDataStub();

    expect(questResumeResponseDataContract.parse(result)).toStrictEqual({
      dispatch: { started: true },
      resumed: true,
      restoredStatus: 'in_progress',
    });
  });

  it('VALID: {dispatch not started, with reason} => keeps the reason', () => {
    const result = QuestResumeResponseDataStub({
      dispatch: { started: false, reason: 'quest has no dispatchable work' },
    });

    expect(questResumeResponseDataContract.parse(result)).toStrictEqual({
      dispatch: { started: false, reason: 'quest has no dispatchable work' },
      resumed: true,
      restoredStatus: 'in_progress',
    });
  });

  it('INVALID: {restoredStatus: bogus} => throws validation error', () => {
    expect(() =>
      questResumeResponseDataContract.parse({
        dispatch: { started: true },
        resumed: true,
        restoredStatus: 'bogus',
      }),
    ).toThrow(/Invalid option/u);
  });
});
