import { questFollowupStopResponseDataContract } from './quest-followup-stop-response-data-contract';
import { QuestFollowupStopResponseDataStub } from './quest-followup-stop-response-data.stub';

describe('questFollowupStopResponseDataContract', () => {
  it('VALID: {default stub} => parses to the default data', () => {
    const result = QuestFollowupStopResponseDataStub();

    expect(questFollowupStopResponseDataContract.parse(result)).toStrictEqual({ stopped: true });
  });

  it('INVALID: {stopped: yes} => throws validation error', () => {
    expect(() => questFollowupStopResponseDataContract.parse({ stopped: 'yes' })).toThrow(
      /expected boolean, received string/u,
    );
  });

  it('INVALID: {unknown key} => throws unrecognized key error', () => {
    expect(() => questFollowupStopResponseDataContract.parse({ stopped: true, extra: 1 })).toThrow(
      /Unrecognized key: \\"extra\\"/u,
    );
  });
});
