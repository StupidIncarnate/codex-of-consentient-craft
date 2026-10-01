import { questFollowupResponseDataContract } from './quest-followup-response-data-contract';
import { QuestFollowupResponseDataStub } from './quest-followup-response-data.stub';

describe('questFollowupResponseDataContract', () => {
  it('VALID: {default stub} => parses to the default data', () => {
    const result = QuestFollowupResponseDataStub();

    expect(questFollowupResponseDataContract.parse(result)).toStrictEqual({
      chatProcessId: 'chat-12345',
    });
  });

  it('INVALID: {missing chatProcessId} => throws validation error', () => {
    expect(() => questFollowupResponseDataContract.parse({})).toThrow(/received undefined/u);
  });

  it('INVALID: {unknown key} => throws unrecognized key error', () => {
    expect(() =>
      questFollowupResponseDataContract.parse({ chatProcessId: 'chat-12345', extra: 1 }),
    ).toThrow(/Unrecognized key: \\"extra\\"/u);
  });

  it('INVALID: {empty string chatProcessId} => throws min length error', () => {
    expect(() => questFollowupResponseDataContract.parse({ chatProcessId: '' })).toThrow(
      /Too small|expected string to have >=1 characters/u,
    );
  });
});
