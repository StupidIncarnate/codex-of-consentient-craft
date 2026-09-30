import { questNewResponseDataContract } from './quest-new-response-data-contract';
import { QuestNewResponseDataStub } from './quest-new-response-data.stub';

describe('questNewResponseDataContract', () => {
  it('VALID: {default stub} => parses to the default data', () => {
    const result = QuestNewResponseDataStub();

    expect(questNewResponseDataContract.parse(result)).toStrictEqual({
      questId: 'add-auth',
      chatProcessId: 'chat-12345',
    });
  });

  it('VALID: {chatProcessId only} => parses without a questId', () => {
    expect(questNewResponseDataContract.parse({ chatProcessId: 'chat-12345' })).toStrictEqual({
      chatProcessId: 'chat-12345',
    });
  });

  it('INVALID: {missing chatProcessId} => throws validation error', () => {
    expect(() => questNewResponseDataContract.parse({ questId: 'add-auth' })).toThrow(
      /received undefined/u,
    );
  });
});
