import { questFindBySessionResponseDataContract } from './quest-find-by-session-response-data-contract';
import { QuestFindBySessionResponseDataStub } from './quest-find-by-session-response-data.stub';

describe('questFindBySessionResponseDataContract', () => {
  it('VALID: {default stub} => parses to the default data', () => {
    const result = QuestFindBySessionResponseDataStub();

    expect(questFindBySessionResponseDataContract.parse(result)).toStrictEqual({
      questId: 'add-auth',
    });
  });

  it('INVALID: {missing questId} => throws validation error', () => {
    expect(() => questFindBySessionResponseDataContract.parse({})).toThrow(/received undefined/u);
  });

  it('INVALID: {unknown key} => throws unrecognized key error', () => {
    expect(() =>
      questFindBySessionResponseDataContract.parse({ questId: 'add-auth', extra: 1 }),
    ).toThrow(/Unrecognized key: \\"extra\\"/u);
  });
});
