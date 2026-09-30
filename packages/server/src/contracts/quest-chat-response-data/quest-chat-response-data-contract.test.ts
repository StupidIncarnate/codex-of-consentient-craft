import { questChatResponseDataContract } from './quest-chat-response-data-contract';
import { QuestChatResponseDataStub } from './quest-chat-response-data.stub';

describe('questChatResponseDataContract', () => {
  it('VALID: {default stub} => parses to the default data', () => {
    const result = QuestChatResponseDataStub();

    expect(questChatResponseDataContract.parse(result)).toStrictEqual({
      chatProcessId: 'chat-12345',
    });
  });

  it('INVALID: {missing chatProcessId} => throws validation error', () => {
    expect(() => questChatResponseDataContract.parse({})).toThrow(/received undefined/u);
  });

  it('INVALID: {unknown key} => throws unrecognized key error', () => {
    expect(() =>
      questChatResponseDataContract.parse({ chatProcessId: 'chat-12345', extra: 1 }),
    ).toThrow(/Unrecognized key: \\"extra\\"/u);
  });
});
