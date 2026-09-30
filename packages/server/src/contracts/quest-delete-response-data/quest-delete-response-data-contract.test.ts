import { questDeleteResponseDataContract } from './quest-delete-response-data-contract';
import { QuestDeleteResponseDataStub } from './quest-delete-response-data.stub';

describe('questDeleteResponseDataContract', () => {
  it('VALID: {default stub} => parses to the default data', () => {
    const result = QuestDeleteResponseDataStub();

    expect(questDeleteResponseDataContract.parse(result)).toStrictEqual({ deleted: true });
  });

  it('INVALID: {deleted: yes} => throws validation error', () => {
    expect(() => questDeleteResponseDataContract.parse({ deleted: 'yes' })).toThrow(
      /expected boolean, received string/u,
    );
  });

  it('INVALID: {unknown key} => throws unrecognized key error', () => {
    expect(() => questDeleteResponseDataContract.parse({ deleted: true, extra: 1 })).toThrow(
      /Unrecognized key: \\"extra\\"/u,
    );
  });
});
