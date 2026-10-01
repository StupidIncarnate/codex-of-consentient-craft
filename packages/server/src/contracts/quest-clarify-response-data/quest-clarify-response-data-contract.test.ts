import { questClarifyResponseDataContract } from './quest-clarify-response-data-contract';
import { QuestClarifyResponseDataStub } from './quest-clarify-response-data.stub';

describe('questClarifyResponseDataContract', () => {
  it('VALID: {default stub} => parses to the default data', () => {
    const result = QuestClarifyResponseDataStub();

    expect(questClarifyResponseDataContract.parse(result)).toStrictEqual({
      chatProcessId: 'chat-12345',
    });
  });

  it('INVALID: {missing chatProcessId} => throws validation error', () => {
    expect(() => questClarifyResponseDataContract.parse({})).toThrow(/received undefined/u);
  });

  it('INVALID: {unknown key} => throws unrecognized key error', () => {
    expect(() =>
      questClarifyResponseDataContract.parse({ chatProcessId: 'chat-12345', extra: 1 }),
    ).toThrow(/Unrecognized key: \\"extra\\"/u);
  });

  it('INVALID: {empty string chatProcessId} => throws min length error', () => {
    expect(() => questClarifyResponseDataContract.parse({ chatProcessId: '' })).toThrow(
      /Too small|expected string to have >=1 characters/u,
    );
  });
});
